import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { useContext, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import userContext from '../context/Usercontext'
import ThemeToggle from '../components/ThemeToggle'
import api from '../api'

const entrance = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.075, delayChildren: 0.12 },
  },
}

function ChatLogo({ reduceMotion }) {
  const animation = reduceMotion ? {} : { y: [0, -4, 0] }
  const transition = reduceMotion
    ? {}
    : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }

  return (
    <motion.div
      variants={entrance}
      animate={animation}
      transition={transition}
      className="mb-3 flex flex-col items-center"
      aria-label="Chatter"
    >
      <div className="relative mb-2">
        <motion.div
          aria-hidden="true"
          animate={reduceMotion ? {} : { opacity: [0.35, 0.75, 0.35], scale: [0.9, 1.12, 0.9] }}
          transition={transition}
          className="absolute -inset-2 rounded-[18px] bg-gradient-to-br from-emerald-400/40 to-green-300/30 blur-xl"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          fill="none"
          className="relative h-10 w-10 drop-shadow-[0_4px_14px_rgba(42,117,100,0.35)]"
        >
          <rect width="40" height="40" rx="13" fill="url(#login-logo-gradient)" />
          <path
            d="M11 18.5a9 9 0 0 1 15.36-6.36A9 9 0 0 1 20 27.5h-6.5l-3.7 2.2 1.2-5.22A8.95 8.95 0 0 1 11 18.5Z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {[16, 20, 24].map((cx, index) => (
            <motion.circle
              key={cx}
              cx={cx}
              cy="19"
              r="1.15"
              fill="white"
              animate={reduceMotion ? {} : { opacity: [0.45, 1, 0.45] }}
              transition={
                reduceMotion
                  ? {}
                  : { duration: 1.2, delay: index * 0.2, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          ))}
          <defs>
            <linearGradient
              id="login-logo-gradient"
              x1="4"
              y1="3"
              x2="37"
              y2="39"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#2A7564" />
              <stop offset="1" stopColor="#55BD94" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-white">
        chatter<span className="text-emerald-300">.</span>
      </span>
    </motion.div>
  )
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 6 6 4.5L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <rect x="3.75" y="8.5" width="12.5" height="8.25" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 8.5V6a3.5 3.5 0 1 1 7 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 11.75v1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5">
      <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.39a4.62 4.62 0 0 1-2 3.03v2.48h3.24c1.9-1.75 2.97-4.34 2.97-7.32Z" />
      <path fill="#34A853" d="M10 20c2.7 0 4.96-.9 6.62-2.45l-3.24-2.48c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.13H1.07v2.55A10 10 0 0 0 10 20Z" />
      <path fill="#FBBC05" d="M4.41 11.89a6.01 6.01 0 0 1 0-3.78V5.56H1.07a10 10 0 0 0 0 8.88l3.34-2.55Z" />
      <path fill="#EA4335" d="M10 3.98c1.47 0 2.79.5 3.83 1.52l2.87-2.87C14.95.99 12.69 0 10 0a10 10 0 0 0-8.93 5.56l3.34 2.55C5.2 5.74 7.4 3.98 10 3.98Z" />
    </svg>
  )
}

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  icon,
  value,
  onChange,
}) {
  return (
    <motion.div variants={entrance} className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <div className="auth-field group flex h-11 items-center gap-3 rounded-xl border border-white/[0.09] bg-[#0b1020]/70 px-3.5 transition duration-200 focus-within:border-emerald-400/60 focus-within:bg-[#10162a] focus-within:ring-4 focus-within:ring-emerald-400/[0.08]">
        <span className="shrink-0 text-slate-500 transition-colors group-focus-within:text-emerald-300">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>
    </motion.div>
  )
}

export default function Login() {
  const {
    loginData,
    isLoggingIn,
    handleLoginChange,
    handleLoginSubmit,
  } = useContext(userContext)
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const authError = searchParams.get('authError')
    if (!authError) return
    const messages = {
      google_not_configured: 'Google sign-in is not configured. Add the Google OAuth credentials to the server environment.',
      google_cancelled: 'Google sign-in was cancelled.',
      google_state_invalid: 'Google sign-in expired. Please try again.',
      google_failed: 'Google sign-in could not be completed. Please try again.',
    }
    toast.error(messages[authError] || messages.google_failed)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])
  const reduceMotion = useReducedMotion()
  const transition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }

  return (
    <MotionConfig reducedMotion="user">
      <main className="auth-page relative isolate flex min-h-screen items-center justify-center overflow-x-hidden bg-[#080b16] px-4 py-8 text-white selection:bg-emerald-400/30 sm:px-6">
        <ThemeToggle floating />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_14%,rgba(42,117,100,0.15),transparent_38%),radial-gradient(ellipse_at_80%_80%,rgba(61,177,128,0.1),transparent_35%)]" />
          {!reduceMotion && (
            <>
              <motion.div
                animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-32 top-[-8rem] h-[27rem] w-[27rem] rounded-full bg-emerald-600/[0.13] blur-[110px]"
              />
              <motion.div
                animate={{ x: [0, -22, 0], y: [0, 20, 0] }}
                transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-36 bottom-[-11rem] h-[32rem] w-[32rem] rounded-full bg-green-500/[0.1] blur-[120px]"
              />
            </>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        </div>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          transition={transition}
          className="mx-auto w-full max-w-[430px]"
          aria-labelledby="login-heading"
        >
          <motion.div
            variants={entrance}
            className="auth-card rounded-[24px] border border-white/[0.09] bg-white/[0.045] p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-7"
          >
            <ChatLogo reduceMotion={reduceMotion} />

            <motion.div variants={entrance} className="mb-6 text-center">
              <h1 id="login-heading" className="text-[30px] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[34px]">
                Welcome Back
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-400">
                Sign in to pick up the conversation.
              </p>
            </motion.div>

            <form aria-label="Sign in" className="space-y-4" onSubmit={handleLoginSubmit}>
              <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                <Field
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  icon={<MailIcon />}
                />
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  icon={<LockIcon />}
                />
              </motion.div>
               
              <motion.div variants={entrance} className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-slate-400">
                  <input type="checkbox" name="remember-me" className="peer sr-only" />
                  <span className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border border-white/20 bg-[#0b1020] text-transparent transition peer-checked:border-emerald-400 peer-checked:bg-emerald-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#111626]">
                    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                      <path d="m2.5 6 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Remember me
                </label>
                
              </motion.div>

              <motion.button
                variants={entrance}
                type="submit"
                disabled={isLoggingIn}
                whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                className="group relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#2a7564] via-[#267966] to-[#1d6657] px-4 text-sm font-semibold text-white shadow-[0_8px_28px_-10px_rgba(42,117,100,0.8)] outline-none transition-shadow hover:shadow-[0_12px_36px_-10px_rgba(42,117,100,0.95)] focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111626] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative">{isLoggingIn ? "Signing in..." : "Sign In"}</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="relative ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>

              <motion.div variants={entrance} className="flex items-center gap-3 py-0.5">
                <span className="h-px flex-1 bg-white/[0.09]" />
                <span className="text-[10px] font-medium tracking-[0.16em] text-slate-600">OR</span>
                <span className="h-px flex-1 bg-white/[0.09]" />
              </motion.div>

              <motion.button
                variants={entrance}
                type="button"
                onClick={() => window.location.assign(`${api.defaults.baseURL}/user/google`)}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.11] bg-white/[0.025] text-[13px] font-medium text-slate-200 outline-none transition-colors hover:border-white/20 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <GoogleMark />
                Continue with Google
              </motion.button>
            </form>

            <motion.footer variants={entrance} className="mt-6 text-center text-[13px] text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-emerald-300 outline-none transition hover:text-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                Create account
              </Link>
            </motion.footer>
          </motion.div>

          <motion.p variants={entrance} className="mt-6 text-center text-[10px] tracking-wide text-slate-700">
            MADE FOR YOUR CONVERSATIONS
          </motion.p>
        </motion.section>
      </main>
    </MotionConfig>
  )
}
