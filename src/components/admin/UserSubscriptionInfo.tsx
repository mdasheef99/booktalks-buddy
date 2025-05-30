import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type UserSubscriptionInfoProps = {
  userId: string;
};

export function UserSubscriptionInfo({ userId }: UserSubscriptionInfoProps) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSubscriptionData() {
      setLoading(true);
      try {
        // Fetch the user's active subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
        }

        const subscription = subscriptionData && subscriptionData.length > 0 ? subscriptionData[0] : null;

        if (subscription) {
          setSubscription(subscription);

          // Fetch payment records for this subscription
          const { data: paymentData, error: paymentError } = await supabase
            .from('payment_records')
            .select(`
              *,
              recorded_by_user:recorded_by(id, displayname, email)
            `)
            .eq('subscription_id', subscription.id)
            .order('payment_date', { ascending: false });

          if (paymentError) {
            console.error('Error fetching payments:', paymentError);
          } else {
            setPayments(paymentData || []);
          }
        }
      } catch (error) {
        console.error('Error in fetchSubscriptionData:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchSubscriptionData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-sm text-muted-foreground">
        No active subscription found.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Subscription
          <Badge variant={subscription.tier === 'privileged_plus' ? 'default' : 'secondary'}>
            {subscription.tier === 'privileged_plus' ? 'Privileged+' : 'Privileged'}
          </Badge>
          <Badge variant="outline">{subscription.subscription_type}</Badge>
        </CardTitle>
        <CardDescription>
          Active until {format(new Date(subscription.end_date), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Subscription Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Started</div>
              <div>{format(new Date(subscription.start_date), 'PPP')}</div>
              <div className="text-muted-foreground">Auto-renew</div>
              <div>{subscription.auto_renew ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {payments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Payment History</h4>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-md p-2 text-sm">
                    <div className="flex justify-between">
                      <div className="font-medium">
                        {payment.amount ? `$${payment.amount}` : 'Amount not specified'}
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(payment.payment_date), 'PPP')}
                      </div>
                    </div>
                    {payment.payment_reference && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ref: {payment.payment_reference}
                      </div>
                    )}
                    {payment.notes && (
                      <div className="text-xs mt-1">{payment.notes}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Recorded by: {payment.recorded_by_user?.displayname || payment.recorded_by_user?.email || 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
