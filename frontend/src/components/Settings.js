import React, { useState } from 'react';
import Navbar from './Navbar';

function Settings({ user, onLogout, onNavigate, onUpdateProfile }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        location: user?.location || '',
        occupation: user?.occupation || '',
    });
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdateProfile(formData);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark text-[#0d131b] dark:text-gray-200 flex flex-col min-h-screen w-full overflow-hidden">
            <Navbar onNavigate={onNavigate} user={user} onLogout={onLogout} />

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto flex flex-col gap-8">
                        <header>
                            <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage your account settings and preferences.</p>
                        </header>

                        <div className="bg-white dark:bg-[#18222e] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update your personal information and contact details.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            id="location"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                            placeholder="Mumbai, India"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="occupation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Occupation
                                        </label>
                                        <input
                                            type="text"
                                            id="occupation"
                                            name="occupation"
                                            value={formData.occupation}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                            placeholder="Software Engineer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#101822] text-gray-900 dark:text-white focus:ring-primary focus:border-primary resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Brief description for your profile. Maximum 200 characters.</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <div className="text-sm text-positive font-medium min-h-[20px]">
                                        {successMessage}
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center rounded-lg bg-primary text-white font-bold py-2.5 px-6 hover:bg-primary/90 transition-colors"
                                        onClick={() => onNavigate('dashboard')}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Settings;
