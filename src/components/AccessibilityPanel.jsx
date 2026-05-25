import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PersonStanding, X, ZoomIn, ZoomOut, Contrast, Zap, Eye, BrainCircuit, 
    RefreshCcw, FileText, EyeOff, Search, ChevronDown, BookOpen
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";

const AccessibilityPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const {
    increaseFontSize,
    decreaseFontSize,
    toggleContrast,
    contrast,
    toggleSeizureSafe,
    seizureSafe,
    toggleVisionImpaired,
    visionImpaired,
    toggleAdhdFriendly,
    adhdFriendly,
    toggleReadingMask,
    readingMask,
    resetAccessibility,
  } = useAccessibility();

  const panelVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const handleToast = (message) => {
    toast({
      title: "🚧 Feature In Progress",
      description: message,
    });
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[60]">
        <motion.button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Open Accessibility Panel"
        >
          <PersonStanding className="w-6 h-6" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-96 bg-blue-600 text-white rounded-2xl shadow-2xl z-[60] overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">Accessibility Adjustments</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button onClick={resetAccessibility} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white flex-1"><RefreshCcw className="w-4 h-4 mr-2" />Reset</Button>
                <Button onClick={() => handleToast("Accessibility statement coming soon!")} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white flex-1"><FileText className="w-4 h-4 mr-2" />Statement</Button>
                <Button onClick={() => setIsOpen(false)} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white flex-1"><EyeOff className="w-4 h-4 mr-2" />Hide</Button>
              </div>
            </div>

            <div className="bg-white text-gray-800 p-4 rounded-t-xl">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Unclear content? Search..." className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onFocus={() => handleToast("Dictionary search is not yet implemented.")} />
              </div>

              <p className="font-bold text-lg mb-3">Choose your accessibility profile</p>
              <div className="space-y-3">
                <ProfileToggle icon={<Zap />} title="Seizure Safe Profile" description="Clear flashes & reduces color" onToggle={toggleSeizureSafe} isChecked={seizureSafe} />
                <ProfileToggle icon={<Eye />} title="Vision Impaired Profile" description="Enhances website's visuals" onToggle={toggleVisionImpaired} isChecked={visionImpaired} />
                <ProfileToggle icon={<BrainCircuit />} title="ADHD Friendly Profile" description="More focus & fewer distractions" onToggle={toggleAdhdFriendly} isChecked={adhdFriendly} />
                <ProfileToggle icon={<BookOpen />} title="Reading Mask" description="Use a reading guide on the page" onToggle={toggleReadingMask} isChecked={readingMask.enabled} />
              </div>
            </div>
            <div className="bg-blue-700 text-center p-2 text-sm">
              Web Accessibility by <span className="font-bold">Plutus</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ProfileToggle = ({ icon, title, description, onToggle, isChecked }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
    <div className="flex items-center">
      <div className="text-blue-600 mr-4">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    <Switch checked={isChecked} onCheckedChange={onToggle} />
  </div>
);

export default AccessibilityPanel;