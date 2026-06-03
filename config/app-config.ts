// Hinweis zur Cron-Semantik: '*/N' im Tag-des-Monats-Feld bedeutet
// "jeder Tag, dessen Tageszahl durch N teilbar ist" (z. B. */10 -> 1., 11., 21., 31.),
// NICHT exakt "alle N Tage". Die Werte entsprechen der Angabe in der README.
export const CONFIG = {
  tasks: [
    {
      name: 'bodenfeuchte_schluf',
      url: 'https://www.dwd.de/DWD/klima/agrar/bf/bf_r_DL_stationen_sl.png',
      // täglich 16:30
      cron: process.env.BF_SCHLUF_CRON || '30 16 * * *'
    },
    {
      name: 'bodenfeuchte_sand',
      url: 'https://www.dwd.de/DWD/klima/agrar/bf/bf_r_DL_stationen_ls.png',
      // täglich 16:30
      cron: process.env.BF_SAND_CRON || '30 16 * * *'
    },
    {
      name: 'bodenfeuchte_sh_ostenfeld',
      url: 'https://www.dwd.de/DWD/klima/agrar/bf/bf_r_SH_A443.png',
      // alle 10 Tage 16:00
      cron: process.env.BF_SH_CRON || '0 16 */10 * *'
    },
    {
      name: 'bodentemperatur_de_5cm',
      url: 'https://www.dwd.de/DWD/klima/agrar/bt/bt_r_DL_stationen.png',
      // alle 5 Tage 16:00
      cron: process.env.BT_DE_CRON || '0 16 */5 * *'
    },
    {
      name: 'bodentemperatur_sh_ostenfeld',
      url: 'https://www.dwd.de/DWD/klima/agrar/bt/bt_r_SH_A443.png',
      // alle 10 Tage 16:00
      cron: process.env.BT_SH_CRON || '0 16 */10 * *'
    }
  ],
  settings: {
    retryCount: Number.parseInt(process.env.RETRY_COUNT || '3'),
    retryDelayMs: Number.parseInt(process.env.RETRY_DELAY_MS || '3000'),
    timeout: Number.parseInt(process.env.TIMEOUT_MS || '60000'),
    imageTimeout: Number.parseInt(process.env.IMAGE_TIMEOUT_MS || '90000'),
    headless: process.env.HEADLESS !== 'false',
    resolution: {
      width: Number.parseInt(process.env.SCREENSHOT_WIDTH || '1920'),
      height: Number.parseInt(process.env.SCREENSHOT_HEIGHT || '1080')
    },
    // monatlich am 1. des Monats um 17:00 (war faelschlich taeglich)
    monthlyDataCron: process.env.MONTHLY_DATA_CRON || '0 17 1 * *'
  }
};
