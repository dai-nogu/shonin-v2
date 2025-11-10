/**
 * AI Feedback生成テストスクリプト
 * 
 * 使い方:
 * npm run test:ai weekly      # 週次フィードバックをテスト（第1週）
 * npm run test:ai weekly 1    # 第1週（11/4-11/10）
 * npm run test:ai weekly 2    # 第2週（11/11-11/17）
 * npm run test:ai weekly 3    # 第3週（11/18-11/24）
 * npm run test:ai weekly 4    # 第4週（11/25-11/30）
 * npm run test:ai weekly all  # 全週を順番にテスト
 * npm run test:ai monthly     # 月次フィードバックをテスト
 */

import { analyzeSessionData, type RawSessionData } from '../lib/session-analyzer';
import { generatePrompts, type PromptGenerationConfig } from '../lib/prompt-generator';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

// テスト用のダミーセッションデータ（1ヶ月分 - Standardプランユーザー）
// 目標1: 筋トレ・フィットネス / 目標2: 英語学習 / 目標3: 副業スキルアップ
const mockSessions: RawSessionData[] = [
  // 11月1日（金）- 仕事終わりのジムトレ
  {
    id: '1', duration: 3600, session_date: '2024-11-01', mood: 4,
    achievements: '胸トレと肩トレを完了。ベンチプレス65kg×8回できた！',
    challenges: '仕事終わりで疲れていたが、ジムに行けた。後半少しバテた。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-01T19:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月2日（土）- 朝活英語
  {
    id: '2', duration: 5400, session_date: '2024-11-02', mood: 5,
    achievements: 'TED Talkを3本視聴。シャドーイングも10分できた。新しい表現を20個メモした。',
    challenges: '特になし。朝の時間は集中しやすい。',
    location: '自宅', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-02T07:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月2日（土）- 午後の筋トレ
  {
    id: '3', duration: 4500, session_date: '2024-11-02', mood: 5,
    achievements: '脚トレの日。スクワット80kg×10回×3セット。有酸素運動も20分。',
    challenges: '脚トレはキツいけど、達成感がすごい。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-02T14:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月3日（日）- 副業プログラミング
  {
    id: '4', duration: 7200, session_date: '2024-11-03', mood: 4,
    achievements: '副業案件のLP制作。デザインカンプからのコーディングが半分完了。',
    challenges: 'レスポンシブ対応で少し詰まったが、調べて解決できた。',
    location: 'カフェ', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-03T10:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月3日（日）- 英語学習
  {
    id: '5', duration: 3600, session_date: '2024-11-03', mood: 4,
    achievements: '英文法の復習。関係代名詞の使い分けがクリアになった。',
    challenges: '少し眠くなったが、コーヒー飲んで乗り切った。',
    location: 'カフェ', goal_id: 'goal-2', activity_id: 'activity-4', start_time: '2024-11-03T15:00:00Z',
    activities: { name: '文法学習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月4日（月）- 朝の筋トレ
  {
    id: '6', duration: 2700, session_date: '2024-11-04', mood: 3,
    achievements: '自宅で自重トレーニング。腕立て・スクワット・プランク各3セット。',
    challenges: '月曜の朝はキツい。でも短時間でもやれた自分を褒めたい。',
    location: '自宅', goal_id: 'goal-1', activity_id: 'activity-5', start_time: '2024-11-04T06:30:00Z',
    activities: { name: '自宅トレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月4日（月）- 通勤中のリスニング
  {
    id: '7', duration: 1800, session_date: '2024-11-04', mood: 3,
    achievements: 'ポッドキャストを通勤時間に聞いた。聞き取れる単語が増えてきた。',
    challenges: '電車が混んでて集中しにくかった。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-04T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月5日（火）- 夜のジムトレ
  {
    id: '8', duration: 3900, session_date: '2024-11-05', mood: 4,
    achievements: '背中と二頭筋のトレーニング。懸垂10回×3セットクリア！',
    challenges: '仕事で疲れていたけど、ジムに行けて良かった。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-05T19:30:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月5日（火）- 深夜の副業作業
  {
    id: '9', duration: 5400, session_date: '2024-11-05', mood: 3,
    achievements: 'LP制作の続き。レスポンシブ対応完了。あと細かい調整だけ。',
    challenges: '眠くて集中力が途切れがち。明日に回した方が良かったかも。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-05T22:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月6日（水）- 朝の英語
  {
    id: '10', duration: 2700, session_date: '2024-11-06', mood: 4,
    achievements: 'オンライン英会話25分。フリートークで趣味について話せた。',
    challenges: '言いたいことがすぐに英語にならない。でも楽しかった。',
    location: '自宅', goal_id: 'goal-2', activity_id: 'activity-6', start_time: '2024-11-06T06:00:00Z',
    activities: { name: '会話練習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月7日（木）- ジムトレ
  {
    id: '11', duration: 3600, session_date: '2024-11-07', mood: 5,
    achievements: '胸と三頭筋。調子が良くてベンチプレス67.5kgに挑戦。成功！',
    challenges: '特になし。体調も良く、集中できた。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-07T18:30:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月8日（金）- 通勤英語
  {
    id: '12', duration: 1800, session_date: '2024-11-08', mood: 3,
    achievements: 'ポッドキャスト聞きながら通勤。シャドーイングも少しできた。',
    challenges: '週末前で疲れてる。集中力が続かなかった。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-08T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月8日（金）- 副業作業
  {
    id: '13', duration: 6300, session_date: '2024-11-08', mood: 4,
    achievements: 'LP制作完了！クライアントに納品。次の案件の打ち合わせ資料も作成。',
    challenges: '細かい修正が多くて時間かかったけど、納品できて達成感。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-08T21:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月9日（土）- 朝活英語
  {
    id: '14', duration: 5400, session_date: '2024-11-09', mood: 5,
    achievements: '文法問題集を50問解いた。正解率85%！理解が深まってる実感。',
    challenges: '特になし。休日の朝は最高に集中できる。',
    location: 'カフェ', goal_id: 'goal-2', activity_id: 'activity-4', start_time: '2024-11-09T08:00:00Z',
    activities: { name: '文法学習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月9日（土）- 午後の筋トレ
  {
    id: '15', duration: 4500, session_date: '2024-11-09', mood: 5,
    achievements: '脚トレ。スクワット82.5kg×10回×3セット。新記録！',
    challenges: 'キツかったけど、重量を上げられて嬉しい。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-09T15:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月10日（日）- 副業リサーチ
  {
    id: '16', duration: 7200, session_date: '2024-11-10', mood: 4,
    achievements: '新しいクライアント候補をリサーチ。営業メールを5社に送信。',
    challenges: '営業は苦手だけど、案件獲得のために頑張った。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-7', start_time: '2024-11-10T10:00:00Z',
    activities: { name: '営業・リサーチ' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月10日（日）- 英語学習
  {
    id: '17', duration: 3600, session_date: '2024-11-10', mood: 4,
    achievements: '洋画を英語字幕で1本観た。聞き取れる部分が増えてきた。',
    challenges: 'まだまだ完璧には聞き取れないけど、成長を感じる。',
    location: '自宅', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-10T19:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月11日（月）- 朝の筋トレ
  {
    id: '18', duration: 2700, session_date: '2024-11-11', mood: 3,
    achievements: '自宅で腹筋と体幹トレーニング。プランク2分キープできた。',
    challenges: '週明けでやる気が出にくかったけど、とりあえず動けた。',
    location: '自宅', goal_id: 'goal-1', activity_id: 'activity-5', start_time: '2024-11-11T06:30:00Z',
    activities: { name: '自宅トレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月11日（月）- 通勤英語
  {
    id: '19', duration: 1800, session_date: '2024-11-11', mood: 3,
    achievements: 'BBC Podcastを聞いた。ニュース英語は難しいけど勉強になる。',
    challenges: '難しい単語が多くて途中で集中が切れた。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-11T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月12日（火）- ジムトレ
  {
    id: '20', duration: 3600, session_date: '2024-11-12', mood: 4,
    achievements: '肩と腹筋。サイドレイズの重量を上げられた。',
    challenges: '仕事が忙しくて疲れてたけど、行けて良かった。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-12T19:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月13日（水）- 朝の英会話
  {
    id: '21', duration: 2700, session_date: '2024-11-13', mood: 5,
    achievements: 'オンライン英会話。仕事の話題でディスカッション。楽しかった！',
    challenges: '専門用語が出てこなかったけど、言い換えて伝えられた。',
    location: '自宅', goal_id: 'goal-2', activity_id: 'activity-6', start_time: '2024-11-13T06:00:00Z',
    activities: { name: '会話練習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月13日（水）- 副業作業
  {
    id: '22', duration: 5400, session_date: '2024-11-13', mood: 4,
    achievements: '新規案件のワイヤーフレーム作成。クライアントから良い反応。',
    challenges: '要件のヒアリングに時間かかったけど、丁寧にできた。',
    location: 'カフェ', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-13T21:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月14日（木）- ジムトレ
  {
    id: '23', duration: 3900, session_date: '2024-11-14', mood: 4,
    achievements: '背中トレ。デッドリフト100kg×8回成功！',
    challenges: 'フォームを意識しながらだったけど、重量上がって嬉しい。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-14T18:30:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月15日（金）- 通勤英語
  {
    id: '24', duration: 1800, session_date: '2024-11-15', mood: 3,
    achievements: 'TED Talkを1本。メモを取りながら聞けた。',
    challenges: '週末前で疲労が溜まってる。でも続けられてる。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-15T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月16日（土）- 朝活英語
  {
    id: '25', duration: 5400, session_date: '2024-11-16', mood: 5,
    achievements: 'リーディング強化。英字新聞を読んだ。語彙力アップを実感。',
    challenges: '難しい単語もあったけど、辞書使いながら頑張った。',
    location: 'カフェ', goal_id: 'goal-2', activity_id: 'activity-8', start_time: '2024-11-16T08:00:00Z',
    activities: { name: 'リーディング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月16日（土）- 午後の筋トレ
  {
    id: '26', duration: 4500, session_date: '2024-11-16', mood: 5,
    achievements: '全身トレーニング。調子が良くて全メニュークリア。',
    challenges: '特になし。体調も良く、充実したトレーニングができた。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-16T14:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月17日（日）- 副業作業
  {
    id: '27', duration: 9000, session_date: '2024-11-17', mood: 4,
    achievements: '新規案件のデザインカンプ作成完了。クライアントミーティングも。',
    challenges: 'デザインに悩んだけど、満足いくものができた。時間はかかった。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-17T10:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月18日（月）- 朝の筋トレ
  {
    id: '28', duration: 2700, session_date: '2024-11-18', mood: 2,
    achievements: '自宅で軽めのストレッチとヨガ。体をほぐせた。',
    challenges: '昨日頑張りすぎて疲れてる。無理せず軽めにした。',
    location: '自宅', goal_id: 'goal-1', activity_id: 'activity-5', start_time: '2024-11-18T06:30:00Z',
    activities: { name: '自宅トレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月18日（月）- 通勤英語
  {
    id: '29', duration: 1800, session_date: '2024-11-18', mood: 3,
    achievements: 'ポッドキャスト聞きながら通勤。継続は力なり。',
    challenges: '月曜は憂鬱だけど、英語学習は続けられてる。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-18T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月19日（火）- ジムトレ
  {
    id: '30', duration: 3600, session_date: '2024-11-19', mood: 4,
    achievements: '胸トレ。ベンチプレス70kg×6回に挑戦して成功！',
    challenges: '重量上げすぎたかもだけど、達成感がすごい。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-19T19:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月20日（水）- 朝の英会話
  {
    id: '31', duration: 2700, session_date: '2024-11-20', mood: 5,
    achievements: 'オンライン英会話。今日の先生は話しやすくて盛り上がった！',
    challenges: '特になし。英会話が楽しみになってきた。',
    location: '自宅', goal_id: 'goal-2', activity_id: 'activity-6', start_time: '2024-11-20T06:00:00Z',
    activities: { name: '会話練習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月20日（水）- 副業作業
  {
    id: '32', duration: 5400, session_date: '2024-11-20', mood: 4,
    achievements: 'コーディング開始。HTMLとCSSの基本構造完成。',
    challenges: 'デザイン通りに実装するのは難しいけど、楽しい。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-20T21:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月21日（木）- ジムトレ
  {
    id: '33', duration: 3900, session_date: '2024-11-21', mood: 4,
    achievements: '脚トレ。スクワット85kg×8回×3セット。着実に成長してる。',
    challenges: '脚トレはいつもキツいけど、やり終えた後の達成感が最高。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-21T18:30:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月22日（金）- 通勤英語
  {
    id: '34', duration: 1800, session_date: '2024-11-22', mood: 4,
    achievements: 'TED Talk聞きながらシャドーイング。発音も意識できた。',
    challenges: '週末前で嬉しい。英語学習も楽しくなってきた。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-22T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月23日（土）- 朝活英語
  {
    id: '35', duration: 5400, session_date: '2024-11-23', mood: 5,
    achievements: 'TOEIC模試のリスニングパート。前回より30点アップ！',
    challenges: '特になし。成長を実感できて嬉しい。',
    location: 'カフェ', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-23T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月23日（土）- 午後の筋トレ
  {
    id: '36', duration: 4500, session_date: '2024-11-23', mood: 5,
    achievements: '全身トレーニング。有酸素運動も30分。体脂肪率が下がってきた！',
    challenges: '特になし。トレーニングが習慣になってきた。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-23T14:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月24日（日）- 副業作業
  {
    id: '37', duration: 10800, session_date: '2024-11-24', mood: 4,
    achievements: 'LP制作ほぼ完成。JavaScriptの実装も完了。テストも問題なし。',
    challenges: 'クロスブラウザ対応で少し手間取ったけど、解決できた。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-24T10:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月25日（月）- 朝の筋トレ
  {
    id: '38', duration: 2700, session_date: '2024-11-25', mood: 3,
    achievements: '自宅で軽めのトレーニング。ストレッチ中心。',
    challenges: '週明けでやる気出ないけど、少しでも動けた。',
    location: '自宅', goal_id: 'goal-1', activity_id: 'activity-5', start_time: '2024-11-25T06:30:00Z',
    activities: { name: '自宅トレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月25日（月）- 通勤英語
  {
    id: '39', duration: 1800, session_date: '2024-11-25', mood: 3,
    achievements: 'ポッドキャスト。継続中。',
    challenges: '特になし。習慣になってきた。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-25T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月26日（火）- ジムトレ
  {
    id: '40', duration: 3600, session_date: '2024-11-26', mood: 5,
    achievements: '背中と二頭筋。調子が良くて全メニュー完璧にこなせた！',
    challenges: '特になし。体調も良く、集中できた。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-26T19:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月26日（火）- 副業納品
  {
    id: '41', duration: 3600, session_date: '2024-11-26', mood: 5,
    achievements: 'LP納品完了！クライアントから高評価をもらえた！次回も依頼もらえそう。',
    challenges: '最終確認で緊張したけど、問題なく納品できた。',
    location: '自宅', goal_id: 'goal-3', activity_id: 'activity-3', start_time: '2024-11-26T21:00:00Z',
    activities: { name: 'Web制作' },
    goals: { id: 'goal-3', title: '副業で月5万円稼ぐ', description: 'Web制作スキルを活かして案件を獲得', deadline: '2025-02-28', target_duration: 216000, weekday_hours: 1.5, weekend_hours: 2, current_value: 54000, status: 'active' }
  },
  // 11月27日（水）- 朝の英会話
  {
    id: '42', duration: 2700, session_date: '2024-11-27', mood: 5,
    achievements: 'オンライン英会話。ビジネス英語の練習。プレゼンの練習ができた。',
    challenges: '難しかったけど、実践的で勉強になった。',
    location: '自宅', goal_id: 'goal-2', activity_id: 'activity-6', start_time: '2024-11-27T06:00:00Z',
    activities: { name: '会話練習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月28日（木）- ジムトレ
  {
    id: '43', duration: 3900, session_date: '2024-11-28', mood: 4,
    achievements: '胸と三頭筋。ベンチプレス70kg×8回に成功！先週より回数増えた。',
    challenges: 'フォームを維持するのが大変だったけど、成長を実感。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-28T18:30:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  },
  // 11月29日（金）- 通勤英語
  {
    id: '44', duration: 1800, session_date: '2024-11-29', mood: 4,
    achievements: 'TED Talk。聞き取れる割合が確実に上がってる。',
    challenges: '特になし。継続が力になってるのを実感。',
    location: '電車', goal_id: 'goal-2', activity_id: 'activity-2', start_time: '2024-11-29T08:00:00Z',
    activities: { name: 'リスニング' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月30日（土）- 朝活英語
  {
    id: '45', duration: 5400, session_date: '2024-11-30', mood: 5,
    achievements: '文法問題集を100問。正解率90%！1ヶ月の成長を実感。',
    challenges: '特になし。毎日続けた成果が出てる。',
    location: 'カフェ', goal_id: 'goal-2', activity_id: 'activity-4', start_time: '2024-11-30T08:00:00Z',
    activities: { name: '文法学習' },
    goals: { id: 'goal-2', title: '英語力の向上', description: 'TOEIC800点を目指して毎日学習', deadline: '2025-06-30', target_duration: 360000, weekday_hours: 1, weekend_hours: 2, current_value: 108000, status: 'active' }
  },
  // 11月30日（土）- 午後の筋トレ（月末）
  {
    id: '46', duration: 4500, session_date: '2024-11-30', mood: 5,
    achievements: '全身トレーニング。1ヶ月前と比べて全ての重量が上がった！体脂肪率も2%減！',
    challenges: '特になし。継続の力を実感。来月も頑張る。',
    location: 'ジム', goal_id: 'goal-1', activity_id: 'activity-1', start_time: '2024-11-30T14:00:00Z',
    activities: { name: 'ジムトレーニング' },
    goals: { id: 'goal-1', title: '体を鍛えて健康的な体づくり', description: '週4回のトレーニングで筋力アップと体脂肪率の改善', deadline: '2025-03-31', target_duration: 288000, weekday_hours: 1, weekend_hours: 1.5, current_value: 72000, status: 'active' }
  }
];

// 週の期間定義
const WEEK_RANGES = {
  1: { start: '2024-11-04', end: '2024-11-10', label: '第1週（11/4-11/10）' },
  2: { start: '2024-11-11', end: '2024-11-17', label: '第2週（11/11-11/17）' },
  3: { start: '2024-11-18', end: '2024-11-24', label: '第3週（11/18-11/24）' },
  4: { start: '2024-11-25', end: '2024-11-30', label: '第4週（11/25-11/30）' },
};

async function testAIFeedback(periodType: 'weekly' | 'monthly', locale: string = 'ja', weekNumber: number = 1) {
  console.log('\n========================================');
  console.log(`🧪 AI Feedback ${periodType === 'weekly' ? '週次' : '月次'}テスト開始`);
  console.log('========================================\n');

  // 環境変数チェック
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ エラー: ANTHROPIC_API_KEY が設定されていません');
    console.error('   .env.local ファイルに ANTHROPIC_API_KEY を設定してください');
    process.exit(1);
  }

  console.log('✅ Claude API Key: 設定済み');
  console.log(`📅 期間タイプ: ${periodType === 'weekly' ? '週次' : '月次'}`);
  if (periodType === 'weekly') {
    const weekInfo = WEEK_RANGES[weekNumber as keyof typeof WEEK_RANGES];
    console.log(`📆 対象週: ${weekInfo.label}`);
  }
  console.log(`🌍 言語: ${locale}`);
  console.log('');

  // 期間設定（週次と月次で異なる範囲を使用）
  let periodStart: string;
  let periodEnd: string;
  
  if (periodType === 'weekly') {
    const weekInfo = WEEK_RANGES[weekNumber as keyof typeof WEEK_RANGES];
    periodStart = weekInfo.start;
    periodEnd = weekInfo.end;
  } else {
    periodStart = '2024-11-01';
    periodEnd = '2024-11-30';
  }

  // 期間でセッションデータをフィルタリング
  const filteredSessions = mockSessions.filter(session => {
    return session.session_date >= periodStart && session.session_date <= periodEnd;
  });

  console.log(`📅 対象期間: ${periodStart} 〜 ${periodEnd}`);
  console.log(`📊 セッション数: ${filteredSessions.length}件`);
  console.log('');

  try {
    // 【層①】セッションデータを分析
    console.log('🔍 [層①] セッションデータを分析中...');
    const analyzedData = analyzeSessionData(
      filteredSessions,
      periodType,
      periodStart,
      periodEnd
    );

    console.log(`   総活動時間: ${analyzedData.totalHours}時間`);
    console.log(`   平均気分: ${analyzedData.averageMood.toFixed(1)}`);
    console.log(`   気分トレンド: ${analyzedData.moodTrend}`);
    console.log(`   継続性スコア: ${Math.round(analyzedData.behaviorPatterns.consistency * 100)}%`);
    console.log('');

    // 【層②】プロンプトを生成
    console.log('📝 [層②] プロンプトを生成中...');
    const promptConfig: PromptGenerationConfig = {
      locale,
      attempt: 1,
      pastFeedbacksCount: 0
    };

    const { systemPrompt, userPrompt, principleText, maxTokens, principleSelection } = generatePrompts(
      analyzedData,
      promptConfig
    );

    console.log(`   最大トークン数: ${maxTokens}`);
    console.log('');
    
  // 法則選択の詳細
  if (principleSelection) {
    console.log('🔬 [科学的法則選択]');
    if (principleSelection.principle) {
      console.log(`   選択された法則: ${principleSelection.principle.name.ja}`);
      console.log(`   学問分野: ${principleSelection.principle.field}`);
      console.log(`   法則の概要: ${principleSelection.principle.summary.ja}`);
      console.log(`   タグ: ${principleSelection.principle.tags?.join(', ') || 'なし'}`);
      console.log('');
      console.log('   📊 選択プロセス:');
      console.log(`   ${principleSelection.reason}`);
    } else {
      console.log(`   法則選択なし: ${principleSelection.reason}`);
    }
    console.log('');
  }

    // 【層③】Claude APIでフィードバック生成
    // 週次: Sonnet 4（軽量・高速・コスパ重視）
    // 月次: Opus 4（最高品質・長文推論）
    const model = periodType === 'weekly' 
      ? 'claude-sonnet-4-20250514'
      : 'claude-opus-4-20250514';
    
    const modelName = periodType === 'weekly' ? 'Sonnet 4' : 'Opus 4';
    
    console.log(`🤖 [層③] Claude API (${modelName}) でフィードバック生成中...`);
    console.log(`   モデル: ${model}`);
    console.log('   (数秒かかります...)\n');

    const startTime = Date.now();

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const feedback = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const usage = message.usage;

    console.log('========================================');
    console.log('✨ 生成されたフィードバック');
    console.log('========================================\n');
    console.log(feedback);
    console.log('');
    console.log('========================================');
    console.log('📊 統計情報');
    console.log('========================================');
    console.log(`⏱️  生成時間: ${duration}秒`);
    console.log(`📏 文字数: ${feedback.length}文字`);
    console.log(`🎯 目標文字数: ${locale === 'en' ? (periodType === 'weekly' ? '750-880' : '1400') : (periodType === 'weekly' ? '320' : '550')}文字`);
    console.log(`✅ 文字数チェック: ${feedback.length <= (locale === 'en' ? (periodType === 'weekly' ? 880 : 1400) : (periodType === 'weekly' ? 320 : 550)) ? '✓ OK' : '✗ 超過'}`);
    console.log('');
    console.log('📈 トークン使用量:');
    console.log(`   入力: ${usage.input_tokens} tokens`);
    console.log(`   出力: ${usage.output_tokens} tokens`);
    console.log('');
    
    // 期間タイプに応じたコスト計算
    const inputRate = periodType === 'weekly' ? 3.0 : 15.0;  // Sonnet: $3, Opus: $15
    const outputRate = periodType === 'weekly' ? 15.0 : 75.0; // Sonnet: $15, Opus: $75
    
    console.log(`💰 推定コスト (Claude ${modelName}):`);
    const inputCost = (usage.input_tokens / 1000000) * inputRate;
    const outputCost = (usage.output_tokens / 1000000) * outputRate;
    const totalCost = inputCost + outputCost;
    console.log(`   入力: $${inputCost.toFixed(6)} (${(inputCost * 150).toFixed(4)}円)`);
    console.log(`   出力: $${outputCost.toFixed(6)} (${(outputCost * 150).toFixed(4)}円)`);
    console.log(`   合計: $${totalCost.toFixed(6)} (${(totalCost * 150).toFixed(4)}円)`);
    
    // 月間コスト推定
    const monthlyCost = periodType === 'weekly' ? totalCost * 4 : totalCost;
    console.log('');
    console.log(`📊 月間推定コスト (${periodType === 'weekly' ? '週次×4回' : '月次×1回'}):`);
    console.log(`   $${monthlyCost.toFixed(4)} (${(monthlyCost * 150).toFixed(2)}円)`);
    console.log('========================================\n');

    console.log('✅ テスト完了！\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// コマンドライン引数を取得
const args = process.argv.slice(2);
const periodType = args[0] as 'weekly' | 'monthly' || 'weekly';
const weekOrLocale = args[1];
let weekNumber = 1;
let locale = 'ja';

if (!['weekly', 'monthly'].includes(periodType)) {
  console.error('❌ エラー: 期間タイプは "weekly" または "monthly" を指定してください');
  console.log('');
  console.log('使い方:');
  console.log('  npm run test:ai weekly      # 週次フィードバックをテスト（第1週・日本語）');
  console.log('  npm run test:ai weekly 1    # 第1週（11/4-11/10）');
  console.log('  npm run test:ai weekly 2    # 第2週（11/11-11/17）');
  console.log('  npm run test:ai weekly 3    # 第3週（11/18-11/24）');
  console.log('  npm run test:ai weekly 4    # 第4週（11/25-11/30）');
  console.log('  npm run test:ai weekly all  # 全週を順番にテスト');
  console.log('  npm run test:ai monthly     # 月次フィードバックをテスト（日本語）');
  console.log('  npm run test:ai weekly 1 en # 第1週（英語）');
  process.exit(1);
}

// 週次の場合、週番号を解析
if (periodType === 'weekly' && weekOrLocale) {
  if (weekOrLocale === 'all') {
    // 全週をテスト
    (async () => {
      console.log('\n🔄 全週のフィードバックを順番に生成します...\n');
      for (let week = 1; week <= 4; week++) {
        await testAIFeedback('weekly', locale, week);
        if (week < 4) {
          console.log('\n⏳ 次の週のテストまで2秒待機...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    })();
  } else if (['1', '2', '3', '4'].includes(weekOrLocale)) {
    weekNumber = parseInt(weekOrLocale);
    locale = args[2] || 'ja';
    // テスト実行
    testAIFeedback(periodType, locale, weekNumber);
  } else if (['ja', 'en'].includes(weekOrLocale)) {
    locale = weekOrLocale;
    // テスト実行
    testAIFeedback(periodType, locale, weekNumber);
  } else {
    console.error('❌ エラー: 週番号は 1, 2, 3, 4, または "all" を指定してください');
    process.exit(1);
  }
} else if (periodType === 'monthly' && weekOrLocale) {
  locale = weekOrLocale;
  // テスト実行
  testAIFeedback(periodType, locale, weekNumber);
} else {
  // テスト実行
  testAIFeedback(periodType, locale, weekNumber);
}

