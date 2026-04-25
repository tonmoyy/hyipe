// app/dashboard/brand/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import toast from 'react-hot-toast'

export default function BrandProfile() {
    const { user } = useAuth()
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [loading, setLoading] = useState(true)

    // Fetch existing profile data
    useEffect(() => {
        if (!user) return

        supabase
            .from('profiles')
            .select('full_name, bio, whatsapp_number')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    toast.error('Could not load profile')
                } else if (data) {
                    setFullName(data.full_name || '')
                    setBio(data.bio || '')
                    setWhatsapp(data.whatsapp_number || '')
                }
                setLoading(false)
            })
    }, [user])

    // Save changes
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                bio,
                whatsapp_number: whatsapp,
            })
            .eq('id', user!.id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Profile updated successfully')
        }
    }

    if (loading) return <div className="p-6">Loading your profile…</div>

    return (
        <div className="max-w-lg">
            <h1 className="text-2xl font-bold mb-6">Brand Profile</h1>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Full name</label>
                    <input
                        placeholder="Your name or company representative"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">About / Bio</label>
                    <textarea
                        placeholder="Tell influencers about your brand"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full border p-2 rounded"
                        rows={4}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp number</label>
                    <input
                        placeholder="+92 3xx xxxxxxx"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
                >
                    Save changes
                </button>
            </form>
        </div>
    )
}