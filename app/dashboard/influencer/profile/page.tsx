'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import toast from 'react-hot-toast'

export default function InfluencerProfile() {
    const { user } = useAuth()
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        supabase.from('profiles').select('full_name,bio,whatsapp_number').eq('id', user.id).maybeSingle().then(({ data }) => {
            if (data) {
                setFullName(data.full_name || '')
                setBio(data.bio || '')
                setWhatsapp(data.whatsapp_number || '')
            }
            setLoading(false)
        })
    }, [user])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('profiles').update({ full_name: fullName, bio, whatsapp_number: whatsapp }).eq('id', user!.id)
        if (error) toast.error(error.message)
        else toast.success('Profile updated')
    }

    if (loading) return <div>Loading...</div>
    return (
        <form onSubmit={handleSave} className="max-w-lg space-y-4">
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border p-2 rounded" />
            <textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} className="w-full border p-2 rounded" rows={4} />
            <input placeholder="WhatsApp Number" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full border p-2 rounded" />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded">Save</button>
        </form>
    )
}