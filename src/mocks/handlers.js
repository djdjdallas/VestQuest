import { rest } from 'msw'

// Define mock handlers for API routes used in the application
export const handlers = [
  // Mock the authentication callback
  rest.get('/api/auth/callback', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    )
  }),

  // Mock grants API
  rest.get('/api/grants', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        grants: [
          {
            id: 'grant-1',
            grant_type: 'ISO',
            shares: 1000,
            strike_price: 2.5,
            current_fmv: 10,
            grant_date: '2023-01-01',
            vesting_start_date: '2023-01-01',
            vesting_end_date: '2027-01-01',
            vesting_cliff_date: '2024-01-01',
            vested_shares: 250,
          },
          {
            id: 'grant-2',
            grant_type: 'RSU',
            shares: 500,
            current_fmv: 10,
            grant_date: '2023-03-15',
            vesting_start_date: '2023-03-15',
            vesting_end_date: '2027-03-15',
            vested_shares: 125,
          },
        ],
      })
    )
  }),

  // Mock scenarios API
  rest.get('/api/scenarios', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        scenarios: [
          {
            id: 'scenario-1',
            scenario_name: 'Early Exit',
            exit_value: 15,
            shares_exercised: 500,
            exercise_cost: 1250,
            gross_proceeds: 7500,
            tax_liability: 1875,
            net_proceeds: 4375,
            roi_percentage: 250,
          },
          {
            id: 'scenario-2',
            scenario_name: 'IPO Exit',
            exit_value: 25,
            shares_exercised: 750,
            exercise_cost: 1875,
            gross_proceeds: 18750,
            tax_liability: 5062.5,
            net_proceeds: 11812.5,
            roi_percentage: 530,
          },
        ],
      })
    )
  }),
]