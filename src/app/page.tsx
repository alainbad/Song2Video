import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Music, Zap, Download, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-purple-400" />
          <span className="text-xl font-bold">Song2Video AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-white/70 hover:text-white">Pricing</Link>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <Badge className="mb-4 bg-purple-600/20 text-purple-400 border-purple-600/30">
          AI-Powered Music Videos
        </Badge>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
          Turn Any Song Into A Music Video Using AI
        </h1>
        <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
          Upload your song. Our AI analyzes your lyrics, creates a storyboard, generates cinematic scenes, and delivers a complete music video in minutes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
              Generate My First Video
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: <Music className="h-8 w-8" />, title: 'Upload Song', desc: 'Upload your MP3, WAV, or FLAC file. We support songs up to 10 minutes.' },
            { step: '02', icon: <Zap className="h-8 w-8" />, title: 'AI Generates', desc: 'Our AI analyzes your lyrics, detects mood, and creates a cinematic storyboard.' },
            { step: '03', icon: <Download className="h-8 w-8" />, title: 'Download Video', desc: 'Get your 1080p MP4 music video ready to publish on YouTube, TikTok, or Instagram.' },
          ].map((item) => (
            <Card key={item.step} className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <div className="text-purple-400 mb-2">{item.icon}</div>
                <div className="text-sm text-purple-400 font-mono">{item.step}</div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-center text-white/60 mb-12">Start free. Scale as you grow.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: 'Starter', price: '$9.99', credits: '10 credits', popular: false },
            { name: 'Creator', price: '$29', credits: '50 credits', popular: false },
            { name: 'Pro', price: '$79', credits: '150 credits', popular: true },
            { name: 'Studio', price: '$199', credits: 'Unlimited', popular: false },
          ].map((plan) => (
            <Card key={plan.name} className={`border text-white relative ${plan.popular ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/10'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">{plan.price}</div>
                <div className="text-sm text-white/60">{plan.credits}</div>
              </CardHeader>
              <CardContent>
                <Link href="/sign-up">
                  <Button className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white/10 hover:bg-white/20'}`}>
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            { q: 'What audio formats are supported?', a: 'We support MP3, WAV, and FLAC files up to 100MB and 10 minutes in length.' },
            { q: 'How long does generation take?', a: 'Most videos are generated in 5-10 minutes depending on song length and server load.' },
            { q: 'What resolution are the videos?', a: 'All videos are exported at 1080p (1920x1080) H.264 MP4 format.' },
            { q: 'Do I own the generated videos?', a: 'Yes. You retain full ownership of videos generated from your music.' },
            { q: 'What is a credit?', a: '1 credit = 1 minute of generated video. A 3-minute song uses 3 credits.' },
          ].map((item, i) => (
            <div key={i} className="border border-white/10 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">{item.q}</div>
                  <div className="text-white/60 text-sm">{item.a}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-white/40 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Music className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-white/60">Song2Video AI</span>
        </div>
        <p>© 2025 Song2Video AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
