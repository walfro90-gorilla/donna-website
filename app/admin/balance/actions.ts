'use server';

import { createClient } from '@/lib/supabase/server';

export type BalanceStats = {
    restaurants: number;
    delivery_agents: number;
    clients: number;
    platform: number;
};

export type TransactionWithDetails = {
    id: string;
    created_at: string;
    amount: number;
    type: string;
    description: string | null;
    account: {
        account_type: string;
        user: {
            name: string | null;
            email: string | null;
            restaurant: {
                name: string;
            }[] | null;
        } | null;
    } | null;
    order_id: string | null;
};

export async function getBalanceStats(): Promise<BalanceStats> {
    const supabase = await createClient();

    // Fetch balances by account type
    // Note: We are summing the 'balance' column from the 'accounts' table.
    const { data, error } = await supabase
        .from('accounts')
        .select('account_type, balance');

    if (error) {
        console.error('Error fetching account balances:', error);
        return { restaurants: 0, delivery_agents: 0, clients: 0, platform: 0 };
    }

    const stats = data.reduce(
        (acc, account) => {
            const balance = Number(account.balance) || 0;
            switch (account.account_type) {
                case 'restaurant':
                    acc.restaurants += balance;
                    break;
                case 'delivery_agent':
                    acc.delivery_agents += balance;
                    break;
                case 'client':
                    acc.clients += balance;
                    break;
                case 'platform':
                case 'platform_revenue':
                case 'platform_payables':
                    acc.platform += balance;
                    break;
            }
            return acc;
        },
        { restaurants: 0, delivery_agents: 0, clients: 0, platform: 0 }
    );

    return stats;
}

export async function getTransactions(
    page: number = 1,
    limit: number = 20,
    filters?: {
        type?: string;
        accountType?: string;
        startDate?: string;
        endDate?: string;
    }
) {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Use !inner if filtering by account type to ensure the filter applies
    const accountJoin = (filters?.accountType && filters.accountType !== 'all') ? 'account:accounts!inner' : 'account:accounts';

    let query = supabase
        .from('account_transactions')
        .select(`
      *,
      ${accountJoin} (
        account_type,
        user:users (
          name,
          email,
          restaurant:restaurants (
            name
          )
        )
      )
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
    }

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
    }

    // Filtering by account type is trickier because it's on the joined table.
    // Supabase supports filtering on joined tables using !inner join syntax if needed,
    // but let's try to filter normally first.
    if (filters?.accountType && filters.accountType !== 'all') {
        query = query.eq('account.account_type', filters.accountType);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching transactions:', error);
        throw new Error('Failed to fetch transactions');
    }

    // Post-process to flatten account name if needed, though UI can handle nested
    return {
        data: data as unknown as TransactionWithDetails[],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
    };
}
