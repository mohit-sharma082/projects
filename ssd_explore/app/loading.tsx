import { Loader } from 'lucide-react';

export default function Loading() {
    return (
        <div className='h-screen w-screen flex items-center justify-center text-lg bg-black text-white'>
            <Loader className='animate-spin mr-2' />
            Loading...
        </div>
    );
}
