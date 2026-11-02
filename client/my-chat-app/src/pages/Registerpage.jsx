import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { useContext, useState } from 'react'
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
    transition: { staggerChildren: 0.075, delayChildren: 0.12 },
  },
}

function Field({
  id,
  name = id,
  label,
  type,
  placeholder,
  autoComplete,
  icon,
  value,
  onChange,
  required = false,
  minLength,
  maxLength,
  showPassword,
  onTogglePassword,
}) {
  const isPassword = name === 'password' || name === 'confirmPassword'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <motion.div variants={entrance} className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-1 text-fuchsia-300" aria-hidden="true">*</span>}
      </label>
      <div className="auth-field group flex h-12 items-center gap-3 rounded-xl border border-white/[0.09] bg-[#0b1020]/70 px-3.5 transition duration-200 focus-within:border-emerald-400/60 focus-within:bg-[#10162a] focus-within:ring-4 focus-within:ring-emerald-400/[0.08]">
        <span className="shrink-0 text-slate-500 transition-colors group-focus-within:text-emerald-300">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={`${showPassword ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            <PasswordVisibilityIcon visible={showPassword} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M3 3l14 14M8.6 5.2A8.8 8.8 0 0 1 10 5c4.8 0 7.5 5 7.5 5a12 12 0 0 1-2.1 2.6M5.2 5.8C3.4 7 2.5 10 2.5 10s2.7 5 7.5 5c.6 0 1.2-.1 1.7-.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NameIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <circle cx="10" cy="6.25" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 16v-1a5.5 5.5 0 0 1 11 0v1h-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
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

function ChatLogo({ reduceMotion }) {
  const floatAnimation = reduceMotion ? {} : { y: [0, -4, 0] }
  const floatTransition = reduceMotion
    ? {}
    : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
  const glowAnimation = reduceMotion ? {} : { opacity: [0.35, 0.75, 0.35], scale: [0.9, 1.12, 0.9] }
  const glowTransition = reduceMotion
    ? {}
    : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }

  return (
    <motion.div
      variants={entrance}
      animate={floatAnimation}
      transition={floatTransition}
      className="mb-3 flex items-center justify-start gap-3"
      aria-label="Chatter"
    >
      <div className="relative mb-2">
        <motion.div
          aria-hidden="true"
          animate={glowAnimation}
          transition={glowTransition}
          className="absolute -inset-2 rounded-[18px] bg-gradient-to-br from-emerald-400/40 to-green-300/30 blur-xl"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          fill="none"
          className="relative h-14 w-14 drop-shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
        >
          <rect width="40" height="40" rx="13" fill="url(#chatter-logo-gradient)" />
          <path
            d="M11 18.5a9 9 0 0 1 15.36-6.36A9 9 0 0 1 20 27.5h-6.5l-3.7 2.2 1.2-5.22A8.95 8.95 0 0 1 11 18.5Z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <motion.circle
            cx="16"
            cy="19"
            r="1.15"
            fill="white"
            animate={reduceMotion ? {} : { opacity: [0.45, 1, 0.45] }}
            transition={reduceMotion ? {} : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="20"
            cy="19"
            r="1.15"
            fill="white"
            animate={reduceMotion ? {} : { opacity: [0.45, 1, 0.45] }}
            transition={reduceMotion ? {} : { duration: 1.2, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="24"
            cy="19"
            r="1.15"
            fill="white"
            animate={reduceMotion ? {} : { opacity: [0.45, 1, 0.45] }}
            transition={reduceMotion ? {} : { duration: 1.2, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient
              id="chatter-logo-gradient"
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
      <span className="flex flex-col">
        <span className="text-[26px] font-semibold tracking-[-0.04em] text-white">
          Chatter<span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent"></span>
        </span>
        <span className="text-[10px] tracking-[0.22em] text-slate-400">Connect · Chat · Share</span>
      </span>
    </motion.div>
  )
}

export function ChatPreview({ reduceMotion }) {
  return (
    <aside className="relative mt-2 hidden h-[320px] w-full items-center justify-center lg:flex xl:h-[360px]" aria-label="Decorative chat illustration">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(49,87,255,0.16),transparent_65%)]" />
      <svg aria-hidden="true" viewBox="0 0 500 360" fill="none" className="relative h-full w-full max-w-[490px] overflow-visible">
        <defs>
          <linearGradient id="phone-frame" x1="120" y1="50" x2="300" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#36C8FF" />
            <stop offset=".48" stopColor="#615BFF" />
            <stop offset="1" stopColor="#A13FFF" />
          </linearGradient>
          <linearGradient id="phone-screen" x1="128" y1="75" x2="270" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#17275B" />
            <stop offset="1" stopColor="#101A43" />
          </linearGradient>
          <linearGradient id="bubble-violet" x1="325" y1="74" x2="391" y2="144" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CFF" />
            <stop offset="1" stopColor="#477BFF" />
          </linearGradient>
          <linearGradient id="bubble-cyan" x1="350" y1="203" x2="437" y2="264" gradientUnits="userSpaceOnUse">
            <stop stopColor="#19D5D0" />
            <stop offset="1" stopColor="#1B9EDF" />
          </linearGradient>
          <linearGradient id="bubble-pink" x1="328" y1="164" x2="376" y2="208" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FA67D7" />
            <stop offset="1" stopColor="#E63EAD" />
          </linearGradient>
          <linearGradient id="avatar-one" x1="129" y1="140" x2="157" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF83D2" />
            <stop offset="1" stopColor="#9E55FF" />
          </linearGradient>
          <linearGradient id="avatar-two" x1="129" y1="190" x2="157" y2="218" gradientUnits="userSpaceOnUse">
            <stop stopColor="#49D8FF" />
            <stop offset="1" stopColor="#3474FF" />
          </linearGradient>
          <linearGradient id="avatar-three" x1="129" y1="240" x2="157" y2="268" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38E0CE" />
            <stop offset="1" stopColor="#13AFAF" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="226" r="50" fill="#822EFF" fillOpacity=".08" stroke="#8A32FF" strokeOpacity=".7" strokeWidth="2" />
        <circle cx="108" cy="227" r="9" fill="#A34AFF" fillOpacity=".6" />
        <path d="m388 116 48 52m-2 0 35-40" stroke="#237BFF" strokeOpacity=".5" strokeWidth="2" />
        <circle cx="471" cy="128" r="4" fill="#16C7FF" />
        <g transform="rotate(-13 203 186)">
          <rect x="105" y="46" width="202" height="300" rx="34" fill="#080F2B" stroke="url(#phone-frame)" strokeWidth="3" />
          <rect x="113" y="54" width="186" height="284" rx="28" fill="url(#phone-screen)" stroke="#7692FF" strokeOpacity=".3" />
          <path d="M176 59h54c0 8-6 14-14 14h-26c-8 0-14-6-14-14Z" fill="#080F2B" />
          <circle cx="263" cy="66" r="3" fill="#88A4FF" fillOpacity=".75" />
          <rect x="127" y="82" width="52" height="8" rx="4" fill="#35477F" />
          <rect x="127" y="99" width="101" height="7" rx="3.5" fill="#35477F" />
          <circle cx="137" cy="151" r="15" fill="url(#avatar-one)" />
          <path d="M135 148a4 4 0 1 1 8 0v2h-8v-2Zm-4 12a6 6 0 0 1 12 0h-12Z" fill="#FFE5FC" />
          <rect x="160" y="137" width="80" height="8" rx="4" fill="#5168B7" />
          <rect x="160" y="151" width="105" height="7" rx="3.5" fill="#2E407A" />
          <circle cx="137" cy="201" r="15" fill="url(#avatar-two)" />
          <circle cx="137" cy="197" r="4" fill="#E5F8FF" />
          <path d="M129 207a8 8 0 0 1 16 0h-16Z" fill="#E5F8FF" />
          <rect x="160" y="187" width="92" height="8" rx="4" fill="#5168B7" />
          <rect x="160" y="201" width="77" height="7" rx="3.5" fill="#2E407A" />
          <circle cx="137" cy="251" r="15" fill="url(#avatar-three)" />
          <circle cx="137" cy="247" r="4" fill="#E2FFFA" />
          <path d="M129 257a8 8 0 0 1 16 0h-16Z" fill="#E2FFFA" />
          <rect x="160" y="237" width="84" height="8" rx="4" fill="#5168B7" />
          <rect x="160" y="251" width="101" height="7" rx="3.5" fill="#2E407A" />
          <circle cx="137" cy="301" r="15" fill="url(#avatar-one)" />
          <circle cx="137" cy="297" r="4" fill="#FFE5FC" />
          <path d="M129 307a8 8 0 0 1 16 0h-16Z" fill="#FFE5FC" />
          <rect x="160" y="287" width="96" height="8" rx="4" fill="#5168B7" />
          <rect x="160" y="301" width="72" height="7" rx="3.5" fill="#2E407A" />
          <circle cx="279" cy="153" r="4" fill="#27D9C5" />
          <circle cx="278" cy="205" r="4" fill="#FA62CF" />
          <circle cx="278" cy="255" r="4" fill="#27D9C5" />
        </g>
        <motion.g
          animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 4.5, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        >
          <path d="M344 49a14 14 0 0 1 14-14h44a14 14 0 0 1 14 14v35a14 14 0 0 1-14 14h-12l-13 12 2-12h-21a14 14 0 0 1-14-14V49Z" fill="url(#bubble-violet)" />
          <circle cx="368" cy="66" r="4" fill="#E8E8FF" />
          <circle cx="382" cy="66" r="4" fill="#E8E8FF" />
          <circle cx="396" cy="66" r="4" fill="#E8E8FF" />
        </motion.g>
        <motion.g
          animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
          transition={{ duration: 5.3, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        >
          <path d="M352 215a11 11 0 0 1 11-11h66a11 11 0 0 1 11 11v35a11 11 0 0 1-11 11h-39l-23 13 5-13h-9a11 11 0 0 1-11-11v-35Z" fill="url(#bubble-cyan)" />
          <path d="M367 228h55m-55 10h38" stroke="#B6FFF8" strokeWidth="4" strokeLinecap="round" />
        </motion.g>
        <path d="M323 166a10 10 0 0 1 10-10h35a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10h-8l-11 11 2-11h-18a10 10 0 0 1-10-10v-28Z" fill="url(#bubble-pink)" />
        <path d="M350 190s-10-6-10-12a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 6-10 12-10 12Z" fill="white" />
        <circle cx="381" cy="295" r="17" fill="#FFB449" />
        <circle cx="375" cy="291" r="2" fill="#57364A" />
        <circle cx="387" cy="291" r="2" fill="#57364A" />
        <path d="M375 299c2 5 10 5 13 0" stroke="#57364A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="347" cy="291" r="3.5" fill="#12D6BD" />
      </svg>
    </aside>
  )
}

export default function Registerpage() {
  const {
    regData,
    isRegistering,
    handleRegistrationChange,
    handleRegistrationSubmit,
  } = useContext(userContext)
  const reduceMotion = useReducedMotion()
  const [passwordVisible, setPasswordVisible] = useState({
    password: false,
    confirmPassword: false,
  })
  const transition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

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

        <div className="mx-auto grid w-full max-w-[1220px] items-center gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 lg:gap-14">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            transition={transition}
            className="hidden min-w-0 flex-col justify-center md:flex"
            aria-label="About Chatter"
          >
            <ChatLogo reduceMotion={reduceMotion} />
            <motion.div variants={entrance} className="mt-3 max-w-[500px]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                Good conversations start here
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white lg:text-[52px]">
                Join Our Chat
                <span className="block bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-200 bg-clip-text text-transparent">
                  Community
                </span>
              </h1>
              <p className="mt-4 max-w-[430px] text-sm leading-7 text-slate-400 lg:text-base">
                Find your people, share what matters, and make every conversation feel closer.
              </p>
            </motion.div>

            <motion.div variants={entrance}>
              <ChatPreview reduceMotion={reduceMotion} />
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-3 gap-3">
              {[
                ['bolt', 'Fast & Secure', 'Your data is always protected'],
                ['users', 'Real-time Chat', 'Connect instantly with your friends'],
                ['shield', 'Always Online', 'Stay connected anytime, anywhere'],
              ].map(([icon, feature, description]) => (
                <motion.div
                  key={feature}
                  variants={entrance}
                  className="border-r border-white/[0.07] px-2 py-2 last:border-r-0 sm:px-3"
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-indigo-400/15 text-indigo-200">
                    {icon === 'bolt' ? (
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="m11 2-7 9h5l-1 7 8-10h-5l1-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                    ) : icon === 'users' ? (
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2.5 16v-1a5.5 5.5 0 0 1 11 0v1h-11Zm12-7a2.5 2.5 0 1 0 0-5m1 7a4 4 0 0 1 2 3.5v1h-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="m10 2 6 2.5v4.8c0 4-2.7 6.7-6 8.7-3.3-2-6-4.7-6-8.7V4.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="m7.5 9.5 1.7 1.7 3.4-3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </span>
                  <p className="mt-2 text-center text-[11px] font-semibold leading-4 text-slate-200 lg:text-xs">{feature}</p>
                  <p className="mt-1 hidden text-center text-[10px] leading-4 text-slate-400 xl:block">{description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            transition={transition}
            className="mx-auto w-full max-w-[460px] md:ml-auto"
            aria-labelledby="registration-heading"
          >
            <motion.div
              variants={entrance}
              className="auth-card rounded-[24px] border border-indigo-300/[0.16] bg-[#111729]/80 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:p-7"
            >
              <motion.div variants={entrance} className="mb-6 text-center">
                <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-indigo-400/15 text-violet-300 ring-1 ring-indigo-300/10">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                    <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3 21v-2a7 7 0 0 1 11.6-5.3M19 14v7m-3.5-3.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h2 id="registration-heading" className="text-[30px] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[34px]">
                  Create Account
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  A few details and you’re ready to join the conversation.
                </p>
              </motion.div>

              <form aria-label="Create your account" className="space-y-4" onSubmit={handleRegistrationSubmit}>
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3.5">
                  <Field
                    id="full-name"
                    label="Full Name"
                    name="name"
                    value={regData.name}
                    type="text"
                    onChange={handleRegistrationChange}
                    placeholder="John Doe"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    
                    icon={<NameIcon />}
                  />
                  <Field
                    id="email"
                    label="Email Address"
                    type="email"
                    name="email"
                    value={regData.email}
                    onChange={handleRegistrationChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  
                    icon={<MailIcon />}
                  />
                  <Field
                    id="password"
                    label="Password"
                    type="password"
                    name="password"
                    value={regData.password}
                    onChange={handleRegistrationChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={72}
                   
                    icon={<LockIcon />}
                    showPassword={passwordVisible.password}
                    onTogglePassword={() => setPasswordVisible((visible) => ({ ...visible, password: !visible.password }))}
                  />
                  <Field
                    id="confirm-password"
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={regData.confirmPassword}
                    onChange={handleRegistrationChange}
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={72}
                   
                    icon={<LockIcon />}
                    showPassword={passwordVisible.confirmPassword}
                    onTogglePassword={() => setPasswordVisible((visible) => ({ ...visible, confirmPassword: !visible.confirmPassword }))}
                  />
                </motion.div>

                <motion.label
                  variants={entrance}
                  className="flex cursor-pointer items-start gap-2.5 pt-1 text-[12px] leading-relaxed text-slate-400"
                >
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={regData.termsAccepted}
                    onChange={handleRegistrationChange}
                    className="peer sr-only"
                  />
                  <span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border border-white/20 bg-[#0b1020] text-transparent transition peer-checked:border-indigo-400 peer-checked:bg-indigo-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#111626]">
                    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                      <path d="m2.5 6 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    I agree to the <span className="font-medium text-indigo-300">Terms and Conditions</span> and{' '}
                    <span className="font-medium text-indigo-300">Privacy Policy</span>.
                  </span>
                </motion.label>

                <motion.button
                  variants={entrance}
                  type="submit"
                  disabled={isRegistering}
                  whileHover={reduceMotion ? undefined : { y: -1, scale: 1.01 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  className="group relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#2a7564] via-[#267966] to-[#1d6657] px-4 text-sm font-semibold text-white shadow-[0_8px_28px_-10px_rgba(42,117,100,0.8)] outline-none transition-shadow hover:shadow-[0_12px_36px_-10px_rgba(42,117,100,0.95)] focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111626] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative">{isRegistering ? "Creating account..." : "Register"}</span>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="relative ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </form>
            </motion.div>

            <motion.footer variants={entrance} className="mt-5 text-center text-[13px] text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-300 transition hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                Login
              </Link>
            </motion.footer>
          </motion.section>
        </div>
      </main>
    </MotionConfig>
  )
}