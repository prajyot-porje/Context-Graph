export function getBaseUrl():string{
  const url=process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`
    :process.env.BETTER_AUTH_URL||(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'http://localhost:3000')
  return url.replace(/\/+$/,'')
}
