// Debug RPC functions to see what they actually return
import { supabase } from './supabase'

export async function debugRPCFunctions() {
  console.log('🔍 Testing RPC functions...')

  try {
    // Test profit by item
    console.log('📊 Testing get_profit_by_item_filtered...')
    const { data: itemData, error: itemError } = await supabase.rpc('get_profit_by_item_filtered', {
      start_date: null,
      end_date: null,
      branch_filter: null,
      page_limit: 5,
      page_offset: 0
    })
    
    console.log('Item RPC result:', { data: itemData, error: itemError })
    if (itemData && itemData.length > 0) {
      console.log('Sample item data:', itemData[0])
      console.log('Item data keys:', Object.keys(itemData[0]))
    }

    // Test profit by invoice
    console.log('📋 Testing get_profit_by_invoice_filtered...')
    const { data: invoiceData, error: invoiceError } = await supabase.rpc('get_profit_by_invoice_filtered', {
      start_date: null,
      end_date: null,
      branch_filter: null,
      page_limit: 5,
      page_offset: 0
    })
    
    console.log('Invoice RPC result:', { data: invoiceData, error: invoiceError })
    if (invoiceData && invoiceData.length > 0) {
      console.log('Sample invoice data:', invoiceData[0])
      console.log('Invoice data keys:', Object.keys(invoiceData[0]))
    }

    // Test profit by customer (working one for comparison)
    console.log('👥 Testing get_profit_by_customer_filtered...')
    const { data: customerData, error: customerError } = await supabase.rpc('get_profit_by_customer_filtered', {
      start_date: null,
      end_date: null,
      branch_filter: null
    })
    
    console.log('Customer RPC result:', { data: customerData, error: customerError })
    if (customerData && customerData.length > 0) {
      console.log('Sample customer data:', customerData[0])
      console.log('Customer data keys:', Object.keys(customerData[0]))
    }

  } catch (error) {
    console.error('❌ Error testing RPC functions:', error)
  }
}

// Call this function in the browser console to debug
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).debugRPC = debugRPCFunctions
}