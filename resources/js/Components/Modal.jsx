import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    maxHeight = 'auto',
    closeable = true,
    onClose = () => {},
    className = '',
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '7xl': 'sm:max-w-7xl',
    }[maxWidth];

    const maxHeightClass = {
        auto: '',
        sm: 'max-h-[400px]',
        md: 'max-h-[500px]',
        lg: 'max-h-[650px]',
        xl: 'max-h-[800px]',
        '2xl': 'max-h-[900px]',
        full: 'max-h-[96vh]',
    }[maxHeight];

    return (
        <Transition show={show} as={Fragment}>
            <Dialog
                as="div"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                onClose={close}
            >
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </TransitionChild>

                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel
                        className={`mb-6 transform overflow-hidden rounded-2xl shadow-2xl transition-all sm:mx-auto sm:w-full flex flex-col ${maxWidthClass} ${maxHeightClass} ${className}`}
                    >
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
