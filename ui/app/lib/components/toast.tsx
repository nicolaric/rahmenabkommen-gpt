// toast.tsx
import { CheckCircleIcon, XIcon, XCircleIcon } from '@phosphor-icons/react';
import * as RadixToast from '@radix-ui/react-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ElementRef,
  ReactNode,
  createContext,
  forwardRef,
  useContext,
  useState,
} from 'react';

const ToastContext = createContext<{
  showToast: (text: string, type: 'success' | 'error') => void;
}>({
  showToast: () => {
    throw new Error(
      "You can't call showToast() outside of a <ToastProvider> – add it to your tree.",
    );
  },
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<
    { id: string; text: string; type: 'success' | 'error' }[]
  >([]);

  function showToast(text: string, type: 'success' | 'error') {
    setMessages((toasts) => [
      ...toasts,
      {
        id: window.crypto.randomUUID(),
        text,
        type,
      },
    ]);
  }

  return (
    <RadixToast.Provider>
      <ToastContext.Provider value={{ showToast }}>
        {children}
      </ToastContext.Provider>

      <AnimatePresence mode="popLayout">
        {messages.map((toast) => (
          <Toast
            key={toast.id}
            text={toast.text}
            type={toast.type}
            onClose={() =>
              setMessages((toasts) => toasts.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </AnimatePresence>

      <RadixToast.Viewport className="fixed right-4 top-4 z-50 flex w-80 flex-col-reverse gap-3 max-sm:top-20" />
    </RadixToast.Provider>
  );
}

const Toast = forwardRef<
  ElementRef<typeof RadixToast.Root>,
  {
    onClose: () => void;
    text: string;
    type: 'success' | 'error';
  }
>(function Toast({ onClose, text, type }, forwardedRef) {
  const width = 320;
  const margin = 16;

  return (
    <RadixToast.Root
      ref={forwardedRef}
      asChild
      forceMount
      onOpenChange={onClose}
      duration={2500}
    >
      <motion.li
        layout
        initial={{ x: width + margin }}
        animate={{ x: 0 }}
        exit={{
          opacity: 0,
          zIndex: -1,
          transition: {
            opacity: {
              duration: 0.2,
            },
          },
        }}
        transition={{
          type: 'spring',
          mass: 1,
          damping: 30,
          stiffness: 200,
        }}
        style={{ width, WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="flex items-center justify-between overflow-hidden whitespace-nowrap rounded-lg border border-gray-300 bg-white text-sm text-gray-700 shadow-sm backdrop-blur">
          <div className="flex flex-grow items-center gap-2 overflow-hidden">
            <div className="px-4">
              {type === 'success' && (
                <CheckCircleIcon
                  size={32}
                  weight="fill"
                  className="text-green-600"
                />
              )}
              {type === 'error' && (
                <XCircleIcon size={32} weight="fill" className="text-red-600" />
              )}
            </div>
            <RadixToast.Description className="truncate">
              {text}
            </RadixToast.Description>
          </div>
          <RadixToast.Close className="p-4 text-gray-500 transition hover:bg-gray-200/30 hover:text-gray-300 active:text-white">
            <XIcon size={16} />
          </RadixToast.Close>
        </div>
      </motion.li>
    </RadixToast.Root>
  );
});
