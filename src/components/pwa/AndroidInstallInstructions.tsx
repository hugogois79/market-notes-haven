
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

interface AndroidInstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AndroidInstallInstructions = ({ open, onOpenChange }: AndroidInstallInstructionsProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0D1117] text-white border-[#1EAEDB]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#1EAEDB]">Install on Android</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            To install this app on your Android device:
            <ol className="mt-3 space-y-3 list-decimal list-inside">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Tap the menu button <span className="inline-block bg-gray-700 text-white px-1 rounded">⋮</span> in Chrome</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Select <span className="font-medium text-[#1EAEDB]">"Install app"</span> or <span className="font-medium text-[#1EAEDB]">"Add to Home screen"</span></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Follow the on-screen instructions to complete installation</span>
              </li>
            </ol>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AndroidInstallInstructions;
