const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cncvxfjsyrntilcbbcfi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuY3Z4ZmpzeXJudGlsY2JiY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODIwNTEsImV4cCI6MjA3MDQ1ODA1MX0.jjQXoi5Yvxl2BqR-QlOtjO9vJFWFg4YowjMXTw3WKA0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestNotification() {
    console.log('Creating test notification...');

    const { data, error } = await supabase
        .from('admin_notifications')
        .insert({
            title: 'Test Notification ' + new Date().toLocaleTimeString(),
            message: 'This is a test notification to verify real-time updates.',
            category: 'system',
            entity_type: 'user',
            target_role: 'admin',
            metadata: { test: true }
        })
        .select();

    if (error) {
        console.error('Error creating notification:', error);
    } else {
        console.log('Notification created successfully:', data);
    }
}

createTestNotification();
