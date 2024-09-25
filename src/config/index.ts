export default () => ({
  port: parseInt(process.env.PORT) || '3005',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
  },
  jwt: {
    secret:
      process.env.JWT_TOKEN_KEY ||
      'e8207cace0a6bbc064402bc906834e5d58c01c2ffc133427a3673da29b1f5496',
  },
  game: {
    totalScanBillPerDay: process.env.TOTAL_SCAN_BILL_PER_DAY || 10,
    timeBlock: process.env.TIME_BLOCK || 8,
    isTest: process.env.IS_TEST || 'false',
    maxSpin: process.env.MAX_SPIN || 10,
    whiteList: process.env.WHITE_LIST || '',
  }
});
