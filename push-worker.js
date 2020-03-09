// UA Web Push: 0b3d476922:1569603225255
importScripts('https://aswpsdkus.com/notify/v1/ua-sdk.min.js')
uaSetup.worker(self, {
  workerUrl: '/push-worker.js',
  
  defaultIcon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Urban_Airship_Logo.jpg/220px-Urban_Airship_Logo.jpg',
  defaultTitle: 'UA Web Push: Prod',
  defaultActionURL: 'https://go.urbanairship.com',
  appKey: 'ISex_TTJRuarzs9-o_Gkhg',
  token: 'MTpJU2V4X1RUSlJ1YXJ6czktb19Ha2hnOkZyc3F4THdzVzNUWDBnZkZMZ2MwTG9BY2dkQ0t0STR2VnJ6Tm9lS2QtZGM',
  vapidPublicKey: 'BFAX8NDGwnWeDbTsGjn6TpCmY6uoJ8SXrexaQR3MR+OU6TwbbjgWDKaZuxturl2CvbU7QTOb4NiD5w1YxOMoLB4='
})
