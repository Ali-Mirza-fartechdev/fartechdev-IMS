import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { loginSchema, type LoginFormValues } from '@/lib/validation'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input } from '@/components/ui/primitives'
import logo from '@/assets/logo.png'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [forgotMode, setForgotMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)
    const { error } = await signIn(values.email, values.password)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    navigate('/')
  }

  const onForgotPassword = async () => {
    const email = getValues('email')
    if (!email) {
      toast.error('Enter your email first')
      return
    }
    setSubmitting(true)
    const { error } = await requestPasswordReset(email)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Password reset link sent')
    setForgotMode(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="FAR Tech" className="h-16 w-auto" />
          <h1 className="mt-4 text-lg font-bold text-white">FAR Tech & Developers</h1>
          <p className="text-sm text-muted">Invoice & Revenue Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="finance@fartechdevelopers.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Login
          </Button>
          <button
            type="button"
            onClick={() => (forgotMode ? onForgotPassword() : setForgotMode(true))}
            className="w-full text-center text-xs text-muted hover:text-accent-light"
          >
            {forgotMode ? 'Send reset link' : 'Forgot Password?'}
          </button>
        </form>
      </div>
    </div>
  )
}
