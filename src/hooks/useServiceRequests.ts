import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceRequest, ServiceRequestWithDetails, CreateServiceRequest, ServiceRequestStatus } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { sendChatNotification, notificationMessages } from '@/lib/chatNotifications';

// Hook for organisers to manage their service requests
export function useMyServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        event:events(*),
        vendor:vendors(*)
      `)
      .eq('requester_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service requests:', error);
    } else {
      setRequests(data as unknown as ServiceRequestWithDetails[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (request: CreateServiceRequest): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('service_requests')
      .insert({
        ...request,
        requester_user_id: user.id,
        status: 'pending',
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('You already sent a request to this vendor for this event');
      } else {
        toast.error('Failed to send request');
        console.error('Error creating service request:', error);
      }
      return false;
    }

    // Send chat notification to vendor about the new request
    const { data: event } = await supabase
      .from('events')
      .select('name, type, estimated_guest_count')
      .eq('id', request.event_id)
      .single();

    if (event) {
      // Send vendor-facing notification about new request
      await sendChatNotification(
        user.id,
        request.vendor_id,
        notificationMessages.newRequestForVendor(
          event.name,
          event.type.charAt(0).toUpperCase() + event.type.slice(1).replace('_', ' '),
          request.guest_count || event.estimated_guest_count || undefined
        ),
        request.event_id
      );
    }

    toast.success('Quote request sent!');
    await fetchRequests();
    return true;
  };

  const cancelRequest = async (requestId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to cancel request');
      console.error('Error cancelling request:', error);
      return false;
    }

    toast.success('Request cancelled');
    await fetchRequests();
    return true;
  };

  const acceptQuote = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    // Get request details for notification
    const { data: requestData } = await supabase
      .from('service_requests')
      .select('vendor_id, event_id')
      .eq('id', requestId)
      .single();

    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'accepted' as ServiceRequestStatus })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to accept quote');
      console.error('Error accepting quote:', error);
      return false;
    }

    // Send chat notification to vendor
    if (requestData) {
      const { data: event } = await supabase
        .from('events')
        .select('name')
        .eq('id', requestData.event_id)
        .single();

      await sendChatNotification(
        user.id,
        requestData.vendor_id,
        notificationMessages.quoteAccepted(event?.name || 'your event'),
        requestData.event_id
      );
    }

    toast.success('Quote accepted!');
    await fetchRequests();
    return true;
  };

  const declineQuote = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    // Get request details for notification
    const { data: requestData } = await supabase
      .from('service_requests')
      .select('vendor_id, event_id')
      .eq('id', requestId)
      .single();

    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'declined' as ServiceRequestStatus })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to decline quote');
      console.error('Error declining quote:', error);
      return false;
    }

    // Send chat notification to vendor
    if (requestData) {
      await sendChatNotification(
        user.id,
        requestData.vendor_id,
        notificationMessages.quoteDeclined(),
        requestData.event_id
      );
    }

    toast.success('Quote declined');
    await fetchRequests();
    return true;
  };

  return {
    requests,
    isLoading,
    createRequest,
    cancelRequest,
    acceptQuote,
    declineQuote,
    refreshRequests: fetchRequests,
  };
}

// Hook for vendors to see incoming requests
export function useVendorServiceRequests() {
  const { vendorProfile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!vendorProfile) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        event:events(*)
      `)
      .eq('vendor_id', vendorProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendor requests:', error);
    } else {
      setRequests(data as unknown as ServiceRequestWithDetails[]);
    }
    setIsLoading(false);
  }, [vendorProfile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const respondToRequest = async (
    requestId: string,
    response: string,
    quotedAmount?: number
  ): Promise<boolean> => {
    // Get request details first for notification
    const { data: requestData } = await supabase
      .from('service_requests')
      .select('requester_user_id, event_id')
      .eq('id', requestId)
      .single();

    const { error } = await supabase
      .from('service_requests')
      .update({
        status: 'quoted' as ServiceRequestStatus,
        vendor_response: response,
        quoted_amount: quotedAmount || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to send response');
      console.error('Error responding to request:', error);
      return false;
    }

    // Send chat notification to user
    if (requestData && vendorProfile) {
      await sendChatNotification(
        requestData.requester_user_id,
        vendorProfile.id,
        notificationMessages.quoteReceived(vendorProfile.name, quotedAmount),
        requestData.event_id
      );
    }

    toast.success('Quote sent!');
    await fetchRequests();
    return true;
  };

  const declineRequest = async (requestId: string, reason?: string): Promise<boolean> => {
    // Get request details first for notification
    const { data: requestData } = await supabase
      .from('service_requests')
      .select('requester_user_id, event_id')
      .eq('id', requestId)
      .single();

    const { error } = await supabase
      .from('service_requests')
      .update({
        status: 'vendor_declined' as ServiceRequestStatus,
        vendor_response: reason || 'Unable to fulfill this request at this time.',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to decline request');
      console.error('Error declining request:', error);
      return false;
    }

    // Send chat notification to user
    if (requestData && vendorProfile) {
      await sendChatNotification(
        requestData.requester_user_id,
        vendorProfile.id,
        notificationMessages.vendorDeclinedRequest(reason),
        requestData.event_id
      );
    }

    toast.success('Request declined');
    await fetchRequests();
    return true;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return {
    requests,
    isLoading,
    pendingCount,
    respondToRequest,
    declineRequest,
    refreshRequests: fetchRequests,
  };
}

// Hook for checking if a request exists for a specific event-vendor pair
export function useServiceRequestStatus(eventId: string, vendorId: string) {
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('vendor_id', vendorId)
        .eq('requester_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching request status:', error);
      } else {
        setRequest(data as ServiceRequest | null);
      }
      setIsLoading(false);
    };

    fetchRequest();
  }, [eventId, vendorId, user]);

  return { request, isLoading };
}