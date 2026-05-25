import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Upload, User } from 'lucide-react';

export default function Avatar({ url, size = 150, onUpload }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (url) {
      downloadImage(url);
    } else {
      setAvatarUrl(null);
    }
  }, [url]);

  async function downloadImage(path) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      const newUrl = URL.createObjectURL(data);
      setAvatarUrl(newUrl);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  }

  async function uploadAvatar(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onUpload(filePath);
      toast({
        title: "Avatar Uploaded!",
        description: "Your new avatar is being processed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="rounded-full object-cover"
            style={{ height: size, width: size }}
          />
        ) : (
          <div 
            className="bg-gray-200 rounded-full flex items-center justify-center text-gray-500"
            style={{ height: size, width: size }}
          >
            <User style={{ height: size / 2, width: size / 2 }} />
          </div>
        )}
      </div>
      <div>
        <Button asChild variant="outline" size="sm">
          <label htmlFor="single" className="cursor-pointer flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </label>
        </Button>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
}