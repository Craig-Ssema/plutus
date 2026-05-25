import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const Support = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const faqs = [
    {
      question: 'How do I start trading?',
      answer: 'To start trading, navigate to the "Trade" page, select an asset, and place your order using the order panel. Make sure your account is funded.',
    },
    {
      question: 'What are the transaction fees?',
      answer: 'We offer competitive transaction fees. A detailed breakdown can be found in your account settings under the "Fees" section.',
    },
    {
      question: 'How can I secure my account?',
      answer: 'We recommend enabling Two-Factor Authentication (2FA) in your profile settings for an extra layer of security. Also, use a strong, unique password.',
    },
    {
      question: 'How long do withdrawals take?',
      answer: 'Withdrawal times vary depending on the method. Crypto withdrawals are typically processed within an hour, while bank transfers may take 1-3 business days.',
    },
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: 'Message Sent! 🚀',
      description: "Thanks for reaching out! Our support team will get back to you shortly.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <Helmet>
        <title>Support - Plutus</title>
        <meta name="description" content="Get help and support for your Plutus account. Find answers in our FAQ or contact our support team directly." />
      </Helmet>

      <div className={cn(
        "pt-16 min-h-screen",
        theme === 'dark' ? 'bg-black' : theme === 'gradient' ? '' : 'bg-gray-50'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <HelpCircle className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h1 className={cn(
              "text-4xl md:text-5xl font-bold mb-4",
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>How can we help?</h1>
            <p className={cn(
              "text-xl",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>We're here to assist you with any questions or issues.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className={cn(
                "text-3xl font-bold mb-6",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Contact Support</h2>
              <form onSubmit={handleSubmit} className={cn(
                "p-8 rounded-2xl shadow-lg space-y-6",
                theme === 'dark'
                  ? 'bg-zinc-900 border border-red-900/30'
                  : theme === 'gradient'
                  ? 'bg-white/20 backdrop-blur-md border border-white/30'
                  : 'bg-white'
              )}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className={cn(
                      "block text-sm font-medium mb-2",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    )}>Full Name</label>
                    <Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label htmlFor="email" className={cn(
                      "block text-sm font-medium mb-2",
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    )}>Email Address</label>
                    <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className={cn(
                    "block text-sm font-medium mb-2",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  )}>Subject</label>
                  <Input id="subject" type="text" placeholder="e.g., Issue with withdrawal" value={formData.subject} onChange={handleInputChange} required />
                </div>
                <div>
                  <label htmlFor="message" className={cn(
                    "block text-sm font-medium mb-2",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  )}>Message</label>
                  <Textarea id="message" placeholder="Describe your issue in detail..." value={formData.message} onChange={handleInputChange} required />
                </div>
                <Button type="submit" className={cn(
                  "w-full text-white py-6 text-lg rounded-xl",
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-lg hover:shadow-red-500/50'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className={cn(
                "text-3xl font-bold mb-6",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className={cn(
                    "p-6 rounded-2xl shadow-lg",
                    theme === 'dark'
                      ? 'bg-zinc-900 border border-red-900/30'
                      : theme === 'gradient'
                      ? 'bg-white/20 backdrop-blur-md border border-white/30'
                      : 'bg-white'
                  )}>
                    <h3 className={cn(
                      "text-lg font-semibold mb-2",
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>{faq.question}</h3>
                    <p className={cn(
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Support;