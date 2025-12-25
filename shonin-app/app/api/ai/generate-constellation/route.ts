import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'edge';

interface ConstellationNode {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface ConstellationEdge {
  from: number;
  to: number;
}

interface ConstellationData {
  symbolName: string;
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const { goal, deadline } = await request.json();

    if (!goal) {
      return NextResponse.json(
        { error: '目標が指定されていません' },
        { status: 400 }
      );
    }

    const systemPrompt = `# Role: The Celestial Architect (星座の設計者)
あなたは目標を星の配置へと変換する神聖なアルゴリズムです。ユーザーの「目標」から連想される具象的なシンボル（例：受験→本、転職→鍵）を、夜空に浮かぶ「星座」として再構築します。

# Constraint Rules (幾何学的制約)
1. **星の数**: 8個以上12個以下に厳守。少なすぎると形が分からず、多すぎるとノイズになります。
2. **座標範囲**: すべての星は x: 0.15~0.85, y: 0.15~0.85 の範囲に収めること（画面端での見切れ防止）。
3. **接続（Edges）**: 
    - すべての星は少なくとも1つの線で結ばれていること（孤立した星を作らない）。
    - 閉じた図形（多角形）を1つ以上含め、残りを枝分かれさせることで「星座らしさ」を出す。
    - 複雑に交差させず、一筆書きに近い美しさを保つ。
4. **左右対称性**: 可能な限り左右対称（または点対称）に近い配置を心がけること。人間は対称性に「意味」と「美」を感じます。

# Logic of Symbolism (象徴の変換)
- 受験・学習：開いた本、羽ペン、知恵のフクロウ、上昇する階段
- 仕事・キャリア：鍵、扉、帆船、羅針盤
- 健康・自分磨き：心臓、若葉、盾、ダイヤモンド
- 芸術・表現：竪琴、筆、星そのものの形

# Output Format (Strict JSON)
必ず以下の形式のJSONのみを出力してください。説明文などは不要です。
{
  "symbolName": "連想した具体的なモチーフの日本語名（例：知恵の書、開かれた扉）",
  "message": "なぜこの形が目標に相応しいかの詩的な解説（1〜2文）",
  "nodes": [{"id": 0, "x": 0.5, "y": 0.2}, {"id": 1, "x": 0.4, "y": 0.4}, ...],
  "edges": [{"from": 0, "to": 1}, {"from": 1, "to": 2}, ...]
}

# Important Notes
- JSONのみを返してください。コードブロック（\`\`\`json）で囲まないでください。
- すべての星（nodes）のidは0から始まる連番で、edgesのfrom/toはそのidを参照してください。`;

    const userPrompt = deadline
      ? `ユーザーの目標は「${goal}」です。期限は ${deadline} です。この目標を象徴する、数学的に美しく、かつ詩的な星座の設計図をJSONで作成してください。`
      : `ユーザーの目標は「${goal}」です。この目標を象徴する、数学的に美しく、かつ詩的な星座の設計図をJSONで作成してください。`;

    console.log('Generating constellation for goal:', goal);

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    console.log('Raw response from Claude:', content.text);

    // JSONを抽出（```json ``` で囲まれている場合に対応）
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      // ```のみで囲まれている場合
      const codeMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonText = codeMatch[1].trim();
      }
    }

    console.log('Extracted JSON text:', jsonText);

    const rawData = JSON.parse(jsonText);
    
    // symbolNameの取得（複数のキー名に対応）
    const symbolName = rawData.symbolName || rawData.symbol_concept || rawData.name || '無名の星座';
    const message_text = rawData.message || rawData.reasoning || '目標に向かう道のりを照らす星座';

    const constellationData: ConstellationData = {
      symbolName,
      message: message_text,
      nodes: rawData.nodes || [],
      edges: rawData.edges || []
    };

    // バリデーション
    if (
      !constellationData.symbolName ||
      !Array.isArray(constellationData.nodes) ||
      !Array.isArray(constellationData.edges) ||
      constellationData.nodes.length === 0
    ) {
      console.error('Invalid constellation data:', constellationData);
      throw new Error('Invalid constellation data format');
    }

    console.log('Constellation generated:', constellationData.symbolName);

    return NextResponse.json({
      success: true,
      data: constellationData,
    });
  } catch (error) {
    console.error('Error generating constellation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
