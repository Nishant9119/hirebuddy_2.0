import { supabase } from '@/lib/supabase';
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
  // Get all contacts from the testdb table
  async getContacts(): Promise<ContactForDisplay[]> {
    try {
      console.log('🔍 Fetching contacts from database...');
      console.log('Supabase client initialized:', !!supabase);
      
      const { data, error } = await supabase
        .from('testdb')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching contacts:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to fetch contacts: ${error.message} (Code: ${error.code})`);
      }

      console.log('✅ Successfully fetched contacts:', data?.length || 0);

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = (data || []).map((contact: Contact) => ({
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

  // Add a new contact to the testdb table
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
      const { data, error } = await supabase
        .from('testdb')
        .insert([contactData])
        .select()
        .single();

      if (error) {
        console.error('Error adding contact:', error);
        throw new Error(`Failed to add contact: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in addContact:', error);
      throw error;
    }
  }

  // Update a contact in the testdb table
  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('testdb')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contact:', error);
        throw new Error(`Failed to update contact: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateContact:', error);
      throw error;
    }
  }

  // Mark email as sent for a contact
  async markEmailSent(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('testdb')
        .update({ email_sent_on: new Date().toISOString() })
        .eq('id', contactId);

      if (error) {
        console.error('Error marking email as sent:', error);
        throw new Error(`Failed to mark email as sent: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in markEmailSent:', error);
      throw error;
    }
  }

  // Delete a contact from the testdb table
  async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('testdb')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting contact:', error);
        throw new Error(`Failed to delete contact: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteContact:', error);
      throw error;
    }
  }

  // Search contacts by name, email, or company
  async searchContacts(searchTerm: string): Promise<ContactForDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('testdb')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching contacts:', error);
        throw new Error(`Failed to search contacts: ${error.message}`);
      }

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = (data || []).map((contact: Contact) => ({
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

  // Get contacts with email addresses only
  async getContactsWithEmail(): Promise<ContactForDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('testdb')
        .select('*')
        .not('email', 'is', null)
        .neq('email', '')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts with email:', error);
        throw new Error(`Failed to fetch contacts with email: ${error.message}`);
      }

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = (data || []).map((contact: Contact) => ({
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

      // Get contacts who have replied (exclude them from follow-up)
      const contactsWhoReplied = await DashboardService.getContactsWhoReplied(user.user.email);
      const repliedContactsSet = new Set(contactsWhoReplied.map(email => email.toLowerCase()));

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
      console.log('Contacts who replied (excluded from follow-up):', contactsWhoReplied.length);
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

  // Get contacts that haven't been sent emails in the last 7 days (for compose section)
  async getContactsAvailableForEmail(): Promise<ContactForDisplay[]> {
    try {
      console.log('🔍 Fetching contacts available for email (no emails sent in last 7 days)...');
      
      // Calculate 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      console.log('7 days ago cutoff:', sevenDaysAgo.toISOString());

      const { data, error } = await supabase
        .from('testdb')
        .select('*')
        .not('email', 'is', null)
        .neq('email', '')
        .or(`email_sent_on.is.null,email_sent_on.lt.${sevenDaysAgo.toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching contacts available for email:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to fetch contacts available for email: ${error.message} (Code: ${error.code})`);
      }

      console.log('✅ Successfully fetched contacts available for email:', data?.length || 0);

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = (data || []).map((contact: Contact) => ({
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

      console.log('Contacts breakdown:');
      console.log('- Never sent emails:', transformedContacts.filter(c => !c.email_sent_on).length);
      console.log('- Last email sent more than 7 days ago:', transformedContacts.filter(c => c.email_sent_on && new Date(c.email_sent_on) < sevenDaysAgo).length);

      return transformedContacts;
    } catch (error) {
      console.error('❌ Error in getContactsAvailableForEmail:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error occurred while fetching contacts available for email: ${String(error)}`);
    }
  }

  // Fallback method for old testdb system
  private async getContactsWithEmailFromtestdb(): Promise<ContactForDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('testdb')
        .select('*')
        .not('email', 'is', null)
        .neq('email', '')
        .not('email_sent_on', 'is', null)
        .order('email_sent_on', { ascending: false });

      if (error) {
        console.error('Error fetching contacts with sent emails from testdb:', error);
        throw new Error(`Failed to fetch contacts with sent emails: ${error.message}`);
      }

      // Transform the data to match the expected interface
      const transformedContacts: ContactForDisplay[] = (data || []).map((contact: Contact) => ({
        id: contact.id,
        name: contact.full_name || contact.first_name || 'Unknown',
        email: contact.email || '',
        company: contact.company_name || undefined,
        title: contact.title || undefined,
        linkedin_link: contact.linkedin_link || undefined,
        company_website: contact.company_website_full || undefined,
        email_sent_on: contact.email_sent_on || undefined,
        status: 'active' as const,
        email_sent: true,
        created_at: contact.created_at,
        updated_at: contact.created_at,
      }));

      return transformedContacts;
    } catch (error) {
      console.error('Error in getContactsWithEmailFromtestdb:', error);
      throw error;
    }
  }
}

export const contactsService = new ContactsService(); 