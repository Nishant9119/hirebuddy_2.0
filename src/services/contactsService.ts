import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { DashboardService } from './dashboardService';

export interface Contact {
  id: string;
  created_at: string;
  full_name: string | null;
  company_name: string | null;
  linkedin_link: string | null;
  email: string | null;
  title: string | null;
  first_name: string | null;
  company_website_full: string | null;
  email_sent_on: string | null;
}

export interface ContactForDisplay {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedin_link?: string;
  company_website?: string;
  email_sent_on?: string;
  status: 'active' | 'inactive';
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

class ContactsService {
  // Get all contacts (via backend)
  async getContacts(): Promise<ContactForDisplay[]> {
    try {
      const { success, data } = await apiClient.getContacts();
      if (!success) throw new Error('Failed to fetch contacts');

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = ((data as any[]) || []).map((contact: Contact) => ({
        id: contact.id,
        name: contact.full_name || contact.first_name || 'Unknown',
        email: contact.email || '',
        company: contact.company_name || undefined,
        title: contact.title || undefined,
        linkedin_link: contact.linkedin_link || undefined,
        company_website: contact.company_website_full || undefined,
        email_sent_on: contact.email_sent_on || undefined,
        status: 'active' as const,
        email_sent: !!contact.email_sent_on,
        created_at: contact.created_at,
        updated_at: contact.created_at,
      }));

      return transformedContacts;
    } catch (error) {
      console.error('❌ Error in getContacts:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error occurred while fetching contacts: ${String(error)}`);
    }
  }

  // Add a new contact (via backend)
  async addContact(contactData: {
    full_name?: string;
    first_name?: string;
    company_name?: string;
    linkedin_link?: string;
    email?: string;
    title?: string;
    company_website_full?: string;
  }): Promise<Contact> {
    try {
      const { success, data, error } = await apiClient.createContact(contactData);
      if (!success) {
        throw new Error(error || 'Failed to add contact');
      }
      return data as unknown as Contact;
    } catch (error) {
      console.error('Error in addContact:', error);
      throw error;
    }
  }

  // Update a contact (via backend)
  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const { success, data, error } = await apiClient.updateContact(id, updates);
      if (!success) {
        throw new Error(error || 'Failed to update contact');
      }
      return data as unknown as Contact;
    } catch (error) {
      console.error('Error in updateContact:', error);
      throw error;
    }
  }

  // Mark email as sent for a contact (via backend)
  async markEmailSent(contactId: string): Promise<void> {
    try {
      const { success, error } = await apiClient.markContactEmailSent(contactId);
      if (!success) throw new Error(error || 'Failed to mark email as sent');
    } catch (error) {
      console.error('Error in markEmailSent:', error);
      throw error;
    }
  }

  // Delete a contact (via backend)
  async deleteContact(id: string): Promise<void> {
    try {
      const { success, error } = await apiClient.deleteContact(id);
      if (!success) throw new Error(error || 'Failed to delete contact');
    } catch (error) {
      console.error('Error in deleteContact:', error);
      throw error;
    }
  }

  // Search contacts by name, email, or company (via backend)
  async searchContacts(searchTerm: string): Promise<ContactForDisplay[]> {
    try {
      const { success, data, error } = await apiClient.searchContacts(searchTerm);
      if (!success) throw new Error(error || 'Failed to search contacts');

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = ((data as any[]) || []).map((contact: Contact) => ({
        id: contact.id,
        name: contact.full_name || contact.first_name || 'Unknown',
        email: contact.email || '',
        company: contact.company_name || undefined,
        title: contact.title || undefined,
        linkedin_link: contact.linkedin_link || undefined,
        company_website: contact.company_website_full || undefined,
        email_sent_on: contact.email_sent_on || undefined,
        status: 'active' as const,
        email_sent: !!contact.email_sent_on,
        created_at: contact.created_at,
        updated_at: contact.created_at,
      }));

      return transformedContacts;
    } catch (error) {
      console.error('Error in searchContacts:', error);
      throw error;
    }
  }

  // Get contacts with email addresses only (via backend)
  async getContactsWithEmail(): Promise<ContactForDisplay[]> {
    try {
      const { success, data, error } = await apiClient.getContactsWithEmail();
      if (!success) throw new Error(error || 'Failed to fetch contacts with email');

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = ((data as any[]) || []).map((contact: Contact) => ({
        id: contact.id,
        name: contact.full_name || contact.first_name || 'Unknown',
        email: contact.email || '',
        company: contact.company_name || undefined,
        title: contact.title || undefined,
        linkedin_link: contact.linkedin_link || undefined,
        company_website: contact.company_website_full || undefined,
        email_sent_on: contact.email_sent_on || undefined,
        status: 'active' as const,
        email_sent: !!contact.email_sent_on,
        created_at: contact.created_at,
        updated_at: contact.created_at,
      }));

      return transformedContacts;
    } catch (error) {
      console.error('Error in getContactsWithEmail:', error);
      throw error;
    }
  }

  // Get contacts to whom the current user has sent emails (for follow-up)
  async getContactsWithSentEmails(): Promise<ContactForDisplay[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      console.log('Getting contacts with sent emails for user:', user.user.email);

      // First, get all email logs for this user from useremaillog table
      let emailLogs: any[] = [];
      try {
        const { data: logs, error } = await supabase
          .from('useremaillog')
          .select('*')
          .eq('user_id', user.user.email) // useremaillog uses email as user_id
          .order('sent_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch from useremaillog table:', error);
        } else {
          emailLogs = logs || [];
          console.log('Found email logs for follow-up:', emailLogs.length);
        }
      } catch (dbError) {
        console.warn('useremaillog table might not exist:', dbError);
      }

      // Get follow-up emails to determine the most recent communication
      let followupLogs: any[] = [];
      try {
        const { data: logs, error } = await supabase
          .from('followuplogs')
          .select('*')
          .eq('user_id', user.user.email) // followuplogs uses email as user_id
          .order('sent_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch from followuplogs table:', error);
        } else {
          followupLogs = logs || [];
          console.log('Found follow-up logs:', followupLogs.length);
        }
      } catch (dbError) {
        console.warn('followuplogs table might not exist:', dbError);
      }

      // Get contacts who have replied (exclude them from follow-up) directly from replies_kpi
      let repliedContactsSet = new Set<string>();
      try {
        const { data: replies, error: repliesErr } = await supabase
          .from('replies_kpi')
          .select('to')
          .eq('user_id', user.user.email)
          .eq('reply', true)
          .not('to', 'is', null);
        if (!repliesErr) {
          repliedContactsSet = new Set((replies || []).map(r => String(r.to).toLowerCase()).filter(Boolean));
        }
      } catch (reErr) {
        console.warn('replies_kpi lookup failed:', reErr);
      }

      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Get all contacts to match with email logs
      const allContacts = await this.getContacts();
      
      if (allContacts.length === 0) {
        console.warn('No contacts found in the system');
        return [];
      }

      // Create a map of email addresses to contact info
      const contactsByEmail = new Map();
      allContacts.forEach(contact => {
        contactsByEmail.set(contact.email.toLowerCase(), contact);
      });

      // Group sent emails by recipient and find the most recent email to each
      const emailsByRecipient = new Map<string, Date>();
      emailLogs.forEach(email => {
        if (email.to) {
          const emailDate = new Date(email.sent_at);
          const existingDate = emailsByRecipient.get(email.to.toLowerCase());
          
          if (!existingDate || emailDate > existingDate) {
            emailsByRecipient.set(email.to.toLowerCase(), emailDate);
          }
        }
      });

      // Group follow-up emails by recipient and find the most recent follow-up to each
      const followupsByRecipient = new Map<string, Date>();
      followupLogs.forEach(email => {
        if (email.to) {
          const followupDate = new Date(email.sent_at);
          const existingDate = followupsByRecipient.get(email.to.toLowerCase());
          
          if (!existingDate || followupDate > existingDate) {
            followupsByRecipient.set(email.to.toLowerCase(), followupDate);
          }
        }
      });

      // Process contacts that need follow-up (24 hours have passed since last communication)
      const contactsNeedingFollowup: ContactForDisplay[] = [];
      const processedEmails = new Set<string>();

      for (const [emailAddress, lastEmailDate] of emailsByRecipient) {
        if (processedEmails.has(emailAddress)) {
          continue;
        }

        // Skip contacts who have replied - no follow-up needed
        if (repliedContactsSet.has(emailAddress.toLowerCase())) {
          processedEmails.add(emailAddress);
          continue;
        }

        const lastFollowupDate = followupsByRecipient.get(emailAddress);
        
        // Determine the most recent communication (email or follow-up)
        const mostRecentCommunication = lastFollowupDate && lastFollowupDate > lastEmailDate 
          ? lastFollowupDate 
          : lastEmailDate;
        
        // Check if it's been more than 24 hours since the last communication
        const isOlderThan24Hours = mostRecentCommunication < twentyFourHoursAgo;
        
        if (isOlderThan24Hours) {
          const contact = contactsByEmail.get(emailAddress);
          
          if (contact) {
            contactsNeedingFollowup.push({
              ...contact,
              email_sent_on: mostRecentCommunication.toISOString(),
              email_sent: true,
              status: 'active'
            });
          } else {
            // Create a contact entry for emails sent to addresses not in contacts
            contactsNeedingFollowup.push({
              id: `email-${emailAddress}`, // Generate a unique ID for non-contact emails
              name: emailAddress.split('@')[0], // Use email prefix as name
              email: emailAddress,
              company: undefined,
              title: undefined,
              linkedin_link: undefined,
              email_sent_on: mostRecentCommunication.toISOString(),
              status: 'active',
              email_sent: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          processedEmails.add(emailAddress);
        }
      }

      console.log('Contacts needing follow-up (24+ hours since last communication):', contactsNeedingFollowup.length);
      console.log('Contacts who replied (excluded from follow-up):', repliedContactsSet.size);
      console.log('24 hours ago cutoff:', twentyFourHoursAgo.toISOString());

      // Sort by last communication date (oldest first, as these need follow-up most urgently)
      return contactsNeedingFollowup.sort((a, b) => 
        new Date(a.email_sent_on || 0).getTime() - new Date(b.email_sent_on || 0).getTime()
      );
    } catch (error) {
      console.error('Error in getContactsWithSentEmails:', error);
      throw error;
    }
  }

  // Get contacts that haven't been sent emails in the last 7 days (via backend)
  async getContactsAvailableForEmail(): Promise<ContactForDisplay[]> {
    try {
      const { success, data, error } = await apiClient.getContactsAvailableForEmail();
      if (!success) throw new Error(error || 'Failed to fetch contacts available for email');

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = ((data as any[]) || []).map((contact: Contact) => ({
        id: contact.id,
        name: contact.full_name || contact.first_name || 'Unknown',
        email: contact.email || '',
        company: contact.company_name || undefined,
        title: contact.title || undefined,
        linkedin_link: contact.linkedin_link || undefined,
        company_website: contact.company_website_full || undefined,
        email_sent_on: contact.email_sent_on || undefined,
        status: 'active' as const,
        email_sent: !!contact.email_sent_on,
        created_at: contact.created_at,
        updated_at: contact.created_at,
      }));

      return transformedContacts;
    } catch (error) {
      console.error('❌ Error in getContactsAvailableForEmail:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error occurred while fetching contacts available for email: ${String(error)}`);
    }
  }

  // Removed fallback that queried testdb directly on the client
}

export const contactsService = new ContactsService(); 