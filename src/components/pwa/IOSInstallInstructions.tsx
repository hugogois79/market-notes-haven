
import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IOSInstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IOSInstallInstructions = ({ open, onOpenChange }: IOSInstallInstructionsProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0D1117] text-white border-[#1EAEDB]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#1EAEDB]">Install on iOS</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            To install this app on your iOS device:
            <ol className="mt-3 space-y-3 list-decimal list-inside">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Tap the Share button <span className="inline-block bg-gray-700 text-white px-1 rounded">📤</span> at the bottom of your screen</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Scroll down and tap <span className="font-medium text-[#1EAEDB]">"Add to Home Screen"</span></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Tap <span className="font-medium text-[#1EAEDB]">"Add"</span> in the top right corner</span>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-gray-800 rounded-md">
              <p className="text-xs text-gray-400">
                Once installed, this app will support your device's color scheme for a seamless experience.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IOSInstallInstructions;
