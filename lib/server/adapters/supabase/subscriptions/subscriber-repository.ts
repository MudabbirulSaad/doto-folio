import { ApplicationError } from '@/lib/server/domain/errors'
import type { SubscriberRepository } from '@/lib/server/application/subscriptions/newsletter-subscription'

export function createSupabaseSubscriberRepository(supabase: any): SubscriberRepository {
  return {
    async findByEmail(email) {
      const { data, error } = await supabase
        .from('subscribers')
        .select('id, status')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to process subscription', [error.message])
      }

      return data || null
    },

    async createSubscriber(data) {
      const { data: subscriber, error } = await supabase
        .from('subscribers')
        .insert([data])
        .select()
        .single()

      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to create subscription', [error.message])
      }

      return subscriber
    },

    async reactivateSubscriber(id, data) {
      const { error } = await supabase
        .from('subscribers')
        .update({ ...data, status: 'active' })
        .eq('id', id)

      if (error) {
        throw new ApplicationError('DATABASE_ERROR', 'Failed to reactivate subscription', [error.message])
      }
    }
  }
}
