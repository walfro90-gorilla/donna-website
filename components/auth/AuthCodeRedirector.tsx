'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCodeRedirectorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            console.log('🔀 AuthCodeRedirector: Auth code detected on root, redirecting to callback...');
            // Construct the new URL with all existing search params
            const params = new URLSearchParams(searchParams.toString());
            router.replace(`/auth/callback?${params.toString()}`);
        }
    }, [searchParams, router]);

    return null;
}

export function AuthCodeRedirector() {
    return (
        <Suspense fallback={null}>
            <AuthCodeRedirectorContent />
        </Suspense>
    );
}
