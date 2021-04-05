const fs = require('fs-extra');
const path = require('path');
const CoinGecko = require('coingecko-api');
const { format, getUnixTime, subDays } = require('date-fns');

const CoinGeckoClient = new CoinGecko();

const WRITE_CONFIG = { spaces: '\t' };

const getWriteFilePath = (currency) => {
  const date = format(new Date(), 'MM_dd_yyyy');

  return path.join(__dirname, 'output', `${currency}.json`);
}

const getTimestampByDaysAgo = (daysAgo) => {
  return getUnixTime(subDays(new Date(), daysAgo));
}

const ensure = async (dirname) => {
  await fs.ensureDir(path.join(__dirname, 'output'));

  if (dirname != null) {
    await fs.ensureDir(path.join(__dirname, 'output', dirname));
  }
}

const fetchCurrenciesList = async () => {
  await ensure();

  const currenciesList = await CoinGeckoClient.coins.list();
  await fs.writeJson(getWriteFilePath('list'), currenciesList, WRITE_CONFIG);

  return currenciesList;
}

const fetchCurrencyData = async (currency) => {
  if (currency == null) {
    throw Error('Currency must be specified');
  }

  await ensure();

  let currencyData = await CoinGeckoClient.coins.fetchMarketChartRange(currency.id, {
    from: getTimestampByDaysAgo(360),
    to: getTimestampByDaysAgo(0),
  });

  await fs.writeJson(getWriteFilePath(currency.symbol.toUpperCase()), currencyData, WRITE_CONFIG);
}

const fetchAll = async () => {
  const list = await fetchCurrenciesList();

  for (const currency of list.data) {
    await new Promise(r => setTimeout(r, 500));

    console.log(`Fetching data of: ${currency.symbol.toUpperCase()} (${list.data.indexOf(currency) + 1}/${list.data.length})`);

    try {
      await fetchCurrencyData(currency);
    } catch (e) {
      try {
        console.log('Retrying 1 ' + currency.symbol.toUpperCase());
        await fetchCurrencyData(currency);
      } catch (e) {
        try {
          console.log('Retrying 2 ' + currency.symbol.toUpperCase());
          await fetchCurrencyData(currency);
        } catch (e) {
          try {
            console.log('Retrying 3 ' + currency.symbol.toUpperCase());
            await fetchCurrencyData(currency);
          } catch (e) {
            try {
              console.log('Retrying 4 ' + currency.symbol.toUpperCase());
              await fetchCurrencyData(currency);
            } catch (e) {
              try {
                console.log('Retrying 5 ' + currency.symbol.toUpperCase());
                await fetchCurrencyData(currency);
              } catch (e) {
                console.log(e);
                console.log('YOLO XDDD');
              }
            }
          }
        }
      }
    }
  }
}

fetchAll();
