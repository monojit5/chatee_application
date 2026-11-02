import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import userContext from '../context/Usercontext'
import ThemeToggle from '../components/ThemeToggle'

const entrance = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
}

function ChatLogo({ reduceMotion }) {
  return (
    <motion.div
      variants={entrance}
      animate={reduceMotion ? {} : { y: [0, -4, 0] }}
      transition={reduceMotion ? {} : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      className="mb-5 flex items-center justify-center gap-3 lg:justify-start"
      aria-label="Chatter"
    >
      <div className="relative mb-2">
        <motion.div
          aria-hidden="true"
          animate={reduceMotion ? {} : { opacity: [0.35, 0.75, 0.35], scale: [0.9, 1.12, 0.9] }}
          transition={reduceMotion ? {} : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-2 rounded-[18px] bg-gradient-to-br from-indigo-400/40 to-cyan-300/30 blur-xl"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          fill="none"
          className="relative h-11 w-11 drop-shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
        >
          <rect width="40" height="40" rx="13" fill="url(#otp-logo-gradient)" />
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
              id="otp-logo-gradient"
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
      <span className="text-[22px] font-semibold tracking-[-0.04em] text-white">
        Chat<span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">App</span>
      </span>
    </motion.div>
  )
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 6 6 4.5L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Otppage() {
  const {
    regData,
    otp,
    isVerifyingOtp,
    isResendingOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleOtpSubmit,
    handleOtpResend,
  } = useContext(userContext)
  const reduceMotion = useReducedMotion()
  const inputRefs = useRef([])
  const transition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  const email = regData?.email?.trim()
  const focusOtpInput = (index) => inputRefs.current[index]?.focus()

  return (
    <MotionConfig reducedMotion="user">
      <main className="auth-page relative isolate flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#080b16] px-4 py-6 text-white selection:bg-emerald-400/30 sm:px-6 sm:py-8">
        <ThemeToggle floating />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_14%,rgba(100,78,220,0.12),transparent_38%),radial-gradient(ellipse_at_80%_80%,rgba(27,169,195,0.09),transparent_35%)]" />
          {!reduceMotion && (
            <>
              <motion.div
                animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-32 top-[-8rem] h-[27rem] w-[27rem] rounded-full bg-violet-600/[0.13] blur-[110px]"
              />
              <motion.div
                animate={{ x: [0, -22, 0], y: [0, 20, 0] }}
                transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-36 bottom-[-11rem] h-[32rem] w-[32rem] rounded-full bg-cyan-500/[0.1] blur-[120px]"
              />
            </>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        </div>

        <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:gap-16">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            transition={transition}
            className="hidden min-w-0 flex-col justify-center lg:flex"
            aria-label="Email verification"
          >
            <ChatLogo reduceMotion={reduceMotion} />
            <motion.div variants={entrance} className="mt-8 max-w-[500px]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">One last little step</p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white xl:text-[52px]">
                You&apos;re almost
                <span className="block bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-200 bg-clip-text text-transparent">in the chat.</span>
              </h1>
              <p className="mt-4 max-w-[410px] text-sm leading-7 text-slate-400 xl:text-base">
                A quick email check helps keep your account safe. Grab your code and come join the conversation.
              </p>
            </motion.div>

            <motion.div variants={entrance} className="relative mt-10 flex min-h-[220px] max-w-[440px] items-center justify-center">
              <div className="absolute h-52 w-52 rounded-full bg-indigo-500/15 blur-[70px]" />
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [0, -1, 0] }}
                transition={{ duration: 5, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
                className="relative w-full max-w-[330px] rounded-[26px] border border-indigo-300/20 bg-gradient-to-br from-indigo-400/15 to-cyan-300/[0.06] p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-400/15 text-indigo-200">
                  <MailIcon />
                </span>
                <div className="mt-5 flex items-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <span key={item} className={`h-2.5 flex-1 rounded-full ${item < 4 ? 'bg-gradient-to-r from-violet-400 to-cyan-300' : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className="mt-4 text-sm font-medium text-white">Your community is just around the corner</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Enter your six-digit code to continue.</p>
                <span className="absolute -right-4 -top-5 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/20 bg-[#111729] text-cyan-200 shadow-lg shadow-cyan-950/30">
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                    <path d="m10 2 6 2.5v4.8c0 4-2.7 6.7-6 8.7-3.3-2-6-4.7-6-8.7V4.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="m7.5 9.5 1.7 1.7 3.4-3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </motion.div>
            </motion.div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            transition={transition}
            className="mx-auto min-w-0 w-full max-w-[430px]"
            aria-labelledby="otp-heading"
          >
            <motion.div
              variants={entrance}
              className="auth-card rounded-[26px] border border-indigo-300/[0.16] bg-[#111729]/80 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:p-8"
            >
              <ChatLogo reduceMotion={reduceMotion} />

              <motion.div variants={entrance} className="mb-7 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-indigo-300/15 bg-gradient-to-br from-indigo-400/15 to-cyan-300/10 text-indigo-200 shadow-lg shadow-indigo-950/20">
                  <MailIcon />
                </div>
                <h2 id="otp-heading" className="text-[28px] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[32px]">
                  Check your email
                </h2>
                <p className="mx-auto mt-2 max-w-[310px] text-sm leading-relaxed text-slate-400">
                  We sent a verification code to
                  <span className="mt-1 block break-all font-medium text-slate-200">{email || 'your email address'}</span>
                </p>
              </motion.div>

              <form onSubmit={handleOtpSubmit} className="auth-field rounded-[20px] border border-white/[0.07] bg-[#0b1020]/45 p-4 sm:p-5">
                <div className="mb-5 text-center">
                  <p className="text-sm font-medium text-slate-200">Enter verification code</p>
                  <p className="mt-1 text-xs text-slate-500">Enter the 6-digit code from your email</p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Six-digit verification code">
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={(element) => { inputRefs.current[index] = element }}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...transition, delay: reduceMotion ? 0 : index * 0.045 }}
                      aria-label={`Code digit ${index + 1}`}
                      type="text"
                      name='otp'
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value, focusOtpInput)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index, focusOtpInput)}
                      onPaste={(event) => handleOtpPaste(event, focusOtpInput)}
                      className="auth-field h-12 min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-[#080d1a]/80 text-center text-lg font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-400/70 focus:bg-emerald-400/[0.06] focus:ring-4 focus:ring-emerald-400/[0.08] sm:h-14 sm:max-w-[54px] sm:text-xl"
                    />
                  ))}
                </div>

                <motion.button
                  variants={entrance}
                  type="submit"
                  disabled={isVerifyingOtp}
                  whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  className="group relative mt-6 flex h-[50px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#2a7564] via-[#267966] to-[#1d6657] px-4 text-sm font-semibold text-white shadow-[0_8px_28px_-10px_rgba(42,117,100,0.8)] outline-none transition-shadow hover:shadow-[0_12px_36px_-10px_rgba(42,117,100,0.95)] focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111626] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative">{isVerifyingOtp ? 'Verifying code...' : 'Verify & Continue'}</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="relative ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </form>

              <motion.p variants={entrance} className="mt-5 text-center text-[13px] text-slate-400">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  onClick={handleOtpResend}
                  disabled={isResendingOtp}
                  className="font-semibold text-indigo-300 outline-none transition hover:text-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  {isResendingOtp ? "Sending…" : "Resend code"}
                </button>
              </motion.p>

              <motion.div variants={entrance} className="mt-5 border-t border-white/[0.07] pt-5">
                <Link
                  to="/login"
                  className="mx-auto flex w-fit items-center gap-2 rounded-lg text-[13px] font-medium text-slate-400 outline-none transition hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path d="M15.5 10H4.5m0 0 4.25-4.25M4.5 10l4.25 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to sign in
                </Link>
              </motion.div>
            </motion.div>

            <motion.p variants={entrance} className="mt-5 text-center text-[10px] tracking-wide text-slate-600">
              MADE FOR YOUR CONVERSATIONS
            </motion.p>
          </motion.section>
        </div>
      </main>
    </MotionConfig>
  )
}
