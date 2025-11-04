import React from 'react';
import { TwitterIcon, FacebookIcon, LinkedInIcon, ShareIcon } from './Icons';

interface SocialShareProps {
  shareText: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ shareText }) => {
  const appUrl = "https://aistudio.google.com/app/project/b8b6935c-4d56-4298-8422-944f3b7ff4c7"; // Replace with actual app URL
  const encodedUrl = encodeURIComponent(appUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  return (
    <div className="mt-8">
       <div className="flex items-center gap-3">
            <ShareIcon className="w-6 h-6 text-slate-500" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Share Your Results</h3>
      </div>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Help spread the word about green energy potential by sharing your report.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-full hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors"
          aria-label="Share on Twitter"
        >
          <TwitterIcon className="w-6 h-6" />
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          aria-label="Share on Facebook"
        >
          <FacebookIcon className="w-6 h-6" />
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 flex items-center justify-center bg-blue-800 text-white rounded-full hover:bg-blue-900 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <LinkedInIcon className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
};

export default SocialShare;
