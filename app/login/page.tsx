'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_DIGITS = 6

export default function LoginPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'locked'>('idle')
  const [message, setMessage] = useState('请输入 6 位访问密码')
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  const slots = useMemo(() => Array.from({ length: MAX_DIGITS }, (_, index) => code[index] ?? ''), [code])
  const isComplete = code.length === MAX_DIGITS

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isComplete || status === 'submitting' || status === 'locked') return

    setStatus('submitting')
    setMessage('正在校验访问密钥')

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await response.json().catch(() => ({}))

    if (response.ok && data.ok) {
      const next = new URL(window.location.href).searchParams.get('next') || '/'
      router.replace(next)
      router.refresh()
      return
    }

    const remaining = typeof data.attemptsRemaining === 'number' ? data.attemptsRemaining : null
    setAttemptsRemaining(remaining)
    setCode('')

    if (response.status === 423 || data.locked) {
      setStatus('locked')
      setMessage('当前浏览器已锁定，无法继续尝试')
      return
    }

    setStatus('error')
    setMessage(remaining === null ? '密码不正确' : `密码不正确，还可尝试 ${remaining} 次`)
    inputRef.current?.focus()
  }

  return (
    <div className="login-stage">
      <div className="login-noise" />
      <div className="login-orbit" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} style={{ ['--i' as string]: index }} />
        ))}
      </div>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-copy">
          <p className="login-kicker">BookBrain Vault</p>
          <h1 id="login-title">进入你的书签脑图</h1>
          <p className="login-subtitle">使用 6 位数字密码解锁知识库，失败 10 次后当前浏览器会话会被锁定。</p>
        </div>

        <form className="login-console" onSubmit={handleSubmit}>
          <div className="digit-reel" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="reel-window" key={index}>
                <div className="reel-strip" style={{ animationDelay: `${index * -0.28}s` }}>
                  {Array.from({ length: 20 }, (_, digitIndex) => (
                    <span key={digitIndex}>{digitIndex % 10}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label className="sr-only" htmlFor="login-code">6 位数字密码</label>
          <input
            ref={inputRef}
            id="login-code"
            className="login-hidden-input"
            value={code}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={MAX_DIGITS}
            autoComplete="one-time-code"
            autoFocus
            disabled={status === 'locked' || status === 'submitting'}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS))
              if (status !== 'locked') {
                setStatus('idle')
                setMessage('请输入 6 位访问密码')
              }
            }}
          />

          <button
            type="button"
            className="code-slots"
            disabled={status === 'locked'}
            onClick={() => inputRef.current?.focus()}
            aria-label="输入 6 位数字密码"
          >
            {slots.map((digit, index) => (
              <span className={digit ? 'filled' : ''} key={index}>
                {digit || '•'}
              </span>
            ))}
          </button>

          <div className="login-status" data-state={status}>
            <span>{message}</span>
            {attemptsRemaining !== null && status !== 'locked' ? (
              <span className="attempt-count">{attemptsRemaining}/10</span>
            ) : null}
          </div>

          <button className="login-submit" type="submit" disabled={!isComplete || status === 'submitting' || status === 'locked'}>
            {status === 'submitting' ? '校验中' : status === 'locked' ? '已锁定' : '解锁'}
          </button>
        </form>
      </section>
    </div>
  )
}
