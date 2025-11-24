import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GlassCard from './ui/GlassCard';
import GradientButton from './ui/GradientButton';
import Input from './ui/Input';
import { Phone, User, Trash2, Plus, AlertTriangle } from 'lucide-react';

interface EmergencyContactsProps {
    userId: string;
}

export default function EmergencyContacts({ userId }: EmergencyContactsProps) {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, [userId]);

    const fetchContacts = async () => {
        try {
            const { data, error } = await supabase
                .from('emergency_contacts')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            setContacts(data || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const addContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('emergency_contacts')
                .insert([
                    {
                        user_id: userId,
                        name: newName,
                        phone: newPhone,
                        relation: 'Emergency Contact'
                    }
                ])
                .select();

            if (error) throw error;

            setContacts([...contacts, data[0]]);
            setNewName('');
            setNewPhone('');
            setIsAdding(false);
        } catch (error: any) {
            alert('Error adding contact: ' + error.message);
        }
    };

    const deleteContact = async (id: string) => {
        try {
            const { error } = await supabase
                .from('emergency_contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setContacts(contacts.filter(c => c.id !== id));
        } catch (error: any) {
            alert('Error deleting contact: ' + error.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Emergency Contacts</h1>
                    <p className="text-gray-400">Trusted people to contact in case of emergency</p>
                </div>
                <GradientButton onClick={() => setIsAdding(!isAdding)} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Contact
                </GradientButton>
            </div>

            {isAdding && (
                <GlassCard className="animate-fade-in">
                    <h3 className="text-lg font-semibold text-white mb-4">Add New Contact</h3>
                    <form onSubmit={addContact} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:flex-1">
                            <Input
                                placeholder="Contact Name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                                icon={<User className="w-4 h-4" />}
                            />
                        </div>
                        <div className="w-full md:flex-1">
                            <Input
                                placeholder="Phone Number"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                required
                                icon={<Phone className="w-4 h-4" />}
                            />
                        </div>
                        <GradientButton type="submit">
                            Save Contact
                        </GradientButton>
                    </form>
                </GlassCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contacts.map((contact) => (
                    <GlassCard key={contact.id} className="group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => deleteContact(contact.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                                {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{contact.name}</h3>
                                <p className="text-gray-400 flex items-center gap-2 text-sm">
                                    <Phone className="w-3 h-3" /> {contact.phone}
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                ))}

                {contacts.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white">No contacts added</h3>
                        <p className="text-gray-400 mt-2">Add trusted contacts for emergency situations.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
