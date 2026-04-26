// app/marketplace/[id]/ApplyModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import toast from 'react-hot-toast'

export default function ApplyModal({
                                       campaignId,
                                       onClose,
                                       onSuccess,
                                   }: {
    campaignId: string
    onClose: () => void
    onSuccess: () => void
}) {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [portfolioLink, setPortfolioLink] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (message.length < 200) {
            toast.error('Description must be at least 200 characters')
            return
        }

        const { error } = await supabase.from('applications').insert({
            campaign_id: campaignId,
            influencer_id: user!.id,
            message,
            portfolio_link: portfolioLink,
            status: 'pending',
        })

        // if (error) {
        //     toast.error(error.message)
        //     return
        // }
        //
        // setSubmitted(true)
        //
        // // Briefly show the thank-you message, then close
        // setTimeout(() => {
        //     onSuccess()
        //     onClose()
        // }, 2000)
        if (error) {
            // This will show detailed info in the browser console
            console.error('Insert error details:', error)
            // Also show a more helpful toast message
            toast.error(`Failed: ${error.message} (code: ${error.code})`)
            return
        }

        // If we get here, the insert succeeded
        console.log('Application inserted successfully')
        setSubmitted(true)

        // Briefly show the thank-you message, then close
        setTimeout(() => {
            onSuccess()
            onClose()
        }, 2000)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded w-full max-w-md">
                {submitted ? (
                    <div className="text-center">
                        <h2 className="text-xl font-bold">
                            Thank you for your application!
                        </h2>
                        <p className="mt-2">The brand has been notified.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold mb-4">Apply</h2>
                        <textarea
                            rows={6}
                            placeholder="Describe why you're a great fit (min 200 characters)..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            className="w-full border p-2 rounded mb-2"
                        />
                        <input
                            type="url"
                            placeholder="Portfolio / relevant content link"
                            value={portfolioLink}
                            onChange={(e) => setPortfolioLink(e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                            >
                                Submit Application
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="border px-4 py-2 rounded hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}