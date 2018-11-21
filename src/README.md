## Instructions to run

npm install

npm run start

## Manual Configs

labeled in comments with #MANUAL

* packing into a dist, need to change `ISPROD` in `setup.ts` to true.
* latency measure in workerSetup.ts --- this is hard to glue into react beucase they are in separate processes.

## Table designs

A tricky part is setting assumptions/default about what information is is columns and what in the rows (pivot-esq).

All the charts, conveniently, have 2 dimentions, so all chart data will be updated to "chartData" for convenience.
