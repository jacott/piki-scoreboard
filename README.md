# piki-scoreboard

Piki is a results-management system for IFSC-format climbing competitions. Piki allows some customization for organizations who wish to modify the competition format: administrators can designate the number of rounds in the competition, the quota of competitors for each round, and the number of boulders for each round in a Boulder competition. Piki's scoring system follows the IFSC rules and is not customizable.

Piki is developed and tested only for use with the Google Chrome web browser. Piki may or may not work with other web browsers.

## Online service

A Piki system is hosted by [Obeya Limited](http://getobeya.com/). Organizations wanting to use the service please read the help page within the system.

## Installing and Testing

Dependencies:

* [Node.js](https://nodejs.org/en/) v6.3.0 or above
* [PostgreSQL](http://www.postgresql.org)

Then check out the project and run:

```sh
sudo -u postgres createuser -drs $USER
npm install
createdb pikidemo
./scripts/reset-test
```

To Demo the system:

```sh
./scripts/start-dev demo
```

Open [localhost:3000](http://localost:3000/)

Use `su@example.com` and `changeme` to sign in.


To run the tests kill any running server and:

```sh
./scripts/start-dev test
```

Then in another terminal:

```sh
./scripts/test
```

## License

[GNU Affero General Public License v3.0](http://www.gnu.org/licenses/agpl.txt)

Copyright (c) 2015, 2016 Geoff Jacobsen <geoffjacobsen@gmail.com>
