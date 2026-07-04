import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui/primitives'
import toast from 'react-hot-toast'

interface ResetForm {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>()

  const onSubmit = async (values: ResetForm) => {
    if (values.password !== values.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password updated. Please log in.')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8">
        <h1 className="mb-6 text-lg font-bold text-white">Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
          />
          <Input
            label="Confirm Password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', { required: 'Confirm your password' })}
          />
          <Button type="submit" className="w-full" loading={submitting}>Update Password</Button>
        </form>
      </div>
    </div>
  )
}
