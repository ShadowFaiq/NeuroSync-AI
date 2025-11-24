/**
 * Clears all Supabase-related data from local storage and cookies.
 * Useful for testing guest flows and ensuring a clean state.
 */
export const clearLocalSession = () => {
    console.log('🧹 Clearing local session...');

    // Clear localStorage items starting with 'supabase.auth'
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth')) {
            localStorage.removeItem(key);
            console.log(`   Removed localStorage key: ${key}`);
        }
    });

    // Clear cookies starting with 'sb-'
    document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.trim().split('=');
        if (name.startsWith('sb-')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            console.log(`   Cleared cookie: ${name}`);
        }
    });

    console.log('✅ Session cleared. Reloading page...');
    window.location.reload();
};
