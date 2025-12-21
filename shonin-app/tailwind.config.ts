import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/**/*.{js,ts,jsx,tsx,mdx}" // src/配下を使っている場合
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  			serif: ['var(--font-cormorant)', 'var(--font-noto-serif-jp)', 'serif'],
  			'serif-jp': ['var(--font-noto-serif-jp)', 'serif'],
  			'serif-en': ['var(--font-cormorant)', 'serif'],
  			mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'monospace'],
  		},
  		colors: {
  			white: '#d0d0d0',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'fade-in-up': {
  				from: { opacity: '0', transform: 'translateY(10px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in-down': {
  				from: { opacity: '0', transform: 'translateY(-10px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				from: { opacity: '0', transform: 'scale(0.95)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			'slide-in-right': {
  				from: { opacity: '0', transform: 'translateX(20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'slide-in-left': {
  				from: { opacity: '0', transform: 'translateX(-20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
			'shimmer': {
				'0%': { backgroundPosition: '-200% 0' },
				'100%': { backgroundPosition: '200% 0' }
			},
			'glow': {
				'0%, 100%': { 
					opacity: '0.7',
				},
				'50%': { 
					opacity: '1',
				}
			},
			'writing': {
				'0%, 100%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
				'25%': { transform: 'translateX(3px) translateY(3px) rotate(5deg)' },
				'50%': { transform: 'translateX(6px) translateY(0) rotate(0deg)' },
				'75%': { transform: 'translateX(3px) translateY(-3px) rotate(-5deg)' },
			},
		'line-draw': {
			'0%': { width: '0%', opacity: '0' },
			'50%': { width: '100%', opacity: '1' },
			'100%': { width: '100%', opacity: '0' }
		},
	'slide-in-from-bottom-left': {
		'0%': { 
			opacity: '0',
			transform: 'translate(-50%, -50%) scale(0.85)',
			transformOrigin: 'bottom left'
		},
		'100%': { 
			opacity: '1',
			transform: 'translate(-50%, -50%) scale(1)',
			transformOrigin: 'bottom left'
		}
	},
	'slide-out-to-bottom-left': {
		'0%': { 
			opacity: '1',
			transform: 'translate(-50%, -50%) scale(1)',
			transformOrigin: 'bottom left'
		},
		'100%': { 
			opacity: '0',
			transform: 'translate(-50%, -50%) scale(0.85)',
			transformOrigin: 'bottom left'
		}
	}
	},
	animation: {
		'accordion-down': 'accordion-down 0.2s ease-out',
		'accordion-up': 'accordion-up 0.2s ease-out',
		'fade-in': 'fade-in 0.3s ease-out',
		'fade-in-up': 'fade-in-up 0.4s ease-out',
		'fade-in-down': 'fade-in-down 0.4s ease-out',
		'scale-in': 'scale-in 0.2s ease-out',
		'slide-in-right': 'slide-in-right 0.3s ease-out',
		'slide-in-left': 'slide-in-left 0.3s ease-out',
		'shimmer': 'shimmer 2s linear infinite',
		'glow': 'glow 3s ease-in-out infinite',
		'writing': 'writing 1s linear infinite',
		'line-draw': 'line-draw 2s ease-in-out infinite',
		'slide-in-from-bottom-left': 'slide-in-from-bottom-left 0.2s cubic-bezier(0.3, 1, 0.3, 1)',
		'slide-out-to-bottom-left': 'slide-out-to-bottom-left 0.2s cubic-bezier(0.3, 0, 0.3, 0)',
	}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
