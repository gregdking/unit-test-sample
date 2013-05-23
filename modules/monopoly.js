define(['underscore'], function (_) {
    var Monopoly = {};

    Monopoly.Dice = (function () {
        function Dice() {
            this.die1 = null;
            this.die2 = null;
        }

        Dice.prototype.roll = function () {
            this.die1 = _.random(1, 6);
            this.die2 = _.random(1, 6);
        }

        Dice.prototype.value = function () {
            return this.die1 + this.die2;
        }

        Dice.prototype.isDoubles = function () {
            return this.die1 === this.die2;
        }

        return Dice;
    }());

    Monopoly.Player = (function () {
        function Player(name) {
            this.name = name;
            this.balance = 0;
            this.locations = [];
        }

        Player.prototype.pay = function (amount) {
            this.balance += amount;
        };

        Player.prototype.charge = function (amount) {
            this.balance -= amount;
        };

        Player.prototype.buy = function (location, price) {
            this.locations.push(location);
            location.owner = this;
            this.charge(price);
        };

        Player.prototype.owns = function (location) {
            return _.contains(this.locations, location);
        };

        Player.prototype.railroads = function () {
            return 0;
        };

        return Player;
    }());

    Monopoly.Game = (function () {
        var NUMBER_OF_ROUNDS = 20;

        function Game(players, board, dice) {
            if (players.length < 2) throw 'Need at least two players to play';
            if (players.length > 8) throw 'No more than 8 players may play';
            this.players = _.shuffle(players)
            this.board = board;
            this.board.setupPlayers(this.players);
            this.dice = dice;
        }

        Game.prototype.play = function () {
            var rounds = [];
            for (var i = 0; i < NUMBER_OF_ROUNDS; i++) {
                var round = new Monopoly.Round(this.players, this.board, this.dice);
                round.play();
                rounds.push(round);
            }
            return rounds;
        };

        return Game;
    }());

    Monopoly.Round = (function () {
        function Round(players, board, dice) {
            this.players = players;
            this.board = board;
            this.dice = dice;
            this.turns = [];
        }

        Round.prototype.play = function () {
            var self = this;
            _.each(this.players, function (player) {
                var turn = new Monopoly.Turn(player, self.board, self.dice);
                self.turns.push(turn);
            });
        };

        return Round;
    }());

    Monopoly.Turn = (function () {
        function Turn(player, board, dice) {
            this.player = player;
            this.board = board;
            this.dice = dice;
        }

        Turn.prototype.play = function () {
            this.dice.roll();
            this.board.move(this.player, this.dice.value());
        };

        return Turn;
    }());

    Monopoly.Movement = (function () {
        function Movement(board, from) {
            this.board = board;
            this.from = from;
            this.to = null;
            this.passedGo = false;
        }

        Movement.prototype.move = function (count) {
            var finalPosition = this.from.ordinal + count;
            if (finalPosition > this.board.locations.length - 1) {
                finalPosition -= this.board.locations.length;
                if (finalPosition !== 0) this.passedGo = true;
            }
            this.to = this.board.locations[finalPosition];
        };

        Movement.prototype.moveTo = function (location, bypassGo) {            
            this.to = location;
            bypassGo = bypassGo || false;
            if (bypassGo) {
                this.passedGo = false;
            } else if (this.to.ordinal === 0) {
                this.passedGo = false;
            } else if (this.to.ordinal <= this.from.ordinal) {
                this.passedGo = true;
            }
            return this;
        };

        return Movement;
    }());

    Monopoly.Location = (function () {
        function Location(name, group, landedOnStrategy) {
            this.name = name;
            this.group = group;
            this.ordinal = 0;
            this.owner = null;
            this.landedOnStrategy = landedOnStrategy;
        }

        Location.prototype.landedOn = function (movement, player) {
            if (this.landedOnStrategy) this.landedOnStrategy.execute(movement, player);
        }

        return Location;
    }());

    Monopoly.Bank = (function () {
        var SALARY = 200;

        function Bank() {}

        Bank.prototype.setupPlayers = function (players) {
            _.each(players, function (player) {
                player.balance = 1500;
            });
        }

        Bank.prototype.processMovement = function (player, board, movement) {
            if (movement.passedGo) board.GO.landedOn(movement, player);
            movement.to.landedOn(movement, player);
        };

        return Bank;
    }());

    Monopoly.Board = (function () {
        function Board(bank) {
            this.groups = {
                Brown: 'Brown',
                LightBlue: 'LightBlue',
                Purple: 'Purple',
                Orange: 'Orange',
                Red: 'Red',
                Yellow: 'Yellow',
                Green: 'Green',
                Blue: 'Blue',
                Railroads: 'Railroads',
                Utilities: 'Utilities'
            }

            this.GO_STRATEGY = new Monopoly.GoStrategy();
            this.REAL_ESTATE_STRATEGY = new Monopoly.RealEstateStrategy();
            this.INCOME_TAX_STRATEGY = new Monopoly.IncomeTaxStrategy();
            this.LUXURY_TAX_STRATEGY = new Monopoly.LuxuryTaxStrategy();

            this.GO = new Monopoly.Location('Go', undefined, this.GO_STRATEGY);
            this.MEDITERRANEAN_AVENUE = new Monopoly.Location('Mediterranean Avenue', this.groups.Brown, new Monopoly.RealEstateStrategy(60));
            this.READING_RAILROAD = new Monopoly.Location('Reading Railroad', this.groups.Railroads);
            this.INCOME_TAX = new Monopoly.Location('Income Tax', undefined, this.INCOME_TAX_STRATEGY);
            this.JAIL = new Monopoly.Location('In Jail/Just Visiting');
            this.ELECTRIC_COMPANY = new Monopoly.Location('Electric Company', this.groups.Utilities);
            this.WATER_WORKS = new Monopoly.Location('Water Works', this.groups.Utilities);
            this.GO_TO_JAIL = new Monopoly.Location('Go to Jail');
            this.PACIFIC_AVENUE = new Monopoly.Location('Pacific Avenue', this.groups.Green, new Monopoly.RealEstateStrategy(300));
            this.LUXURY_TAX = new Monopoly.Location('Luxury Tax', undefined, this.LUXURY_TAX_STRATEGY);
            this.BOARDWALK = new Monopoly.Location('Boardwalk', this.groups.Blue, new Monopoly.RealEstateStrategy(400));

            this.bank = bank;
            this.players = [];
            this.playerLocations = [];
            this.locations = [
                this.GO,
                this.MEDITERRANEAN_AVENUE,
                new Monopoly.Location('Community Chest'),
                new Monopoly.Location('Baltic Avenue', this.groups.Brown, new Monopoly.RealEstateStrategy(60)),
                this.INCOME_TAX,
                this.READING_RAILROAD,
                new Monopoly.Location('Oriental Avenue', this.groups.LightBlue, new Monopoly.RealEstateStrategy(100)),
                new Monopoly.Location('Chance'),
                new Monopoly.Location('Vermont Avenue', this.groups.LightBlue, new Monopoly.RealEstateStrategy(100)),
                new Monopoly.Location('Connecticut Avenue', this.groups.LightBlue, new Monopoly.RealEstateStrategy(120)),
                this.JAIL,
                new Monopoly.Location('St. Charles Place', this.groups.Purple, new Monopoly.RealEstateStrategy(140)),
                this.ELECTRIC_COMPANY,
                new Monopoly.Location('States Avenue', this.groups.Purple, new Monopoly.RealEstateStrategy(140)),
                new Monopoly.Location('Virginia Avenue', this.groups.Purple, new Monopoly.RealEstateStrategy(160)),
                new Monopoly.Location('Pennsylvania Railroad', this.groups.Railroads),
                new Monopoly.Location('St. James Place', this.groups.Orange, new Monopoly.RealEstateStrategy(180)),
                new Monopoly.Location('Community Chest'),
                new Monopoly.Location('Tennessee Avenue', this.groups.Orange, new Monopoly.RealEstateStrategy(180)),
                new Monopoly.Location('New York Avenue', this.groups.Orange, new Monopoly.RealEstateStrategy(200)),
                new Monopoly.Location('Free Parking'),
                new Monopoly.Location('Kentucky Avenue', this.groups.Red, new Monopoly.RealEstateStrategy(220)),
                new Monopoly.Location('Chance'),
                new Monopoly.Location('Indiana Avenue', this.groups.Red, new Monopoly.RealEstateStrategy(220)),
                new Monopoly.Location('Illinois Avenue', this.groups.Red, new Monopoly.RealEstateStrategy(240)),
                new Monopoly.Location('B & O Railroad', this.groups.Railroads),
                new Monopoly.Location('Atlantic Avenue', this.groups.Yellow, new Monopoly.RealEstateStrategy(260)),
                new Monopoly.Location('Ventnor Avenue', this.groups.Yellow, new Monopoly.RealEstateStrategy(260)),
                this.WATER_WORKS,
                new Monopoly.Location('Marvin Gardens', this.groups.Yellow, new Monopoly.RealEstateStrategy(280)),
                this.GO_TO_JAIL,
                this.PACIFIC_AVENUE,
                new Monopoly.Location('North Carolina Avenue', this.groups.Green, new Monopoly.RealEstateStrategy(300)),
                new Monopoly.Location('Community Chest'),
                new Monopoly.Location('Pennsylvania Avenue', this.groups.Green, new Monopoly.RealEstateStrategy(320)),
                new Monopoly.Location('Short Line', this.groups.Railroads),
                new Monopoly.Location('Chance'),
                new Monopoly.Location('Park Place', this.groups.Blue, new Monopoly.RealEstateStrategy(350)),
                this.LUXURY_TAX,
                this.BOARDWALK
            ];

            _.each(this.locations, function (location, i) {
                location.ordinal = i;
            });
        }

        Board.prototype.setupPlayers = function (players) {
            var self = this;
            this.players = players;
            this.playerLocations = _.map(this.players, function (player) {
                return self.GO;
            });
            this.bank.setupPlayers(players);
        };

        Board.prototype.currentLocation = function (player) {
            return this.playerLocations[getPlayerIndex(this, player)];
        };

        Board.prototype.move = function (player, spaces) {            
            var movement = new Monopoly.Movement(this, this.currentLocation(player));
            movement.move(spaces);
            executeMovement(this, player, movement);
        };

        Board.prototype.moveTo = function (player, location, bypassGo) {
            bypassGo = bypassGo || false;
            var movement = new Monopoly.Movement(this, this.currentLocation(player));
            movement.moveTo(location, bypassGo);
            executeMovement(this, player, movement);
        };

        Board.prototype.locationsByGroup = function (group) {
            return _.filter(this.locations, function (location) {
                return location.group === group;
            });
        };

        function movePlayerToLocation(self, player, location) {
            self.playerLocations[getPlayerIndex(self, player)] = location;
        }

        function getPlayerIndex(self, player) {
            return _.indexOf(self.players, player);
        }

        function executeMovement(self, player, movement) {
            movePlayerToLocation(self, player, movement.to);
            self.bank.processMovement(player, self, movement);
            if (movement.to === self.GO_TO_JAIL) {
                self.moveTo(player, self.JAIL, true);
            }
        }

        return Board;
    }());

    Monopoly.RealEstateStrategy = (function () {
        function RealEstateStrategy(price) {
            this.price = price;
        }

        RealEstateStrategy.prototype.execute = function (movement, player) {
            if (!movement.to.owner) {
                player.buy(movement.to, this.price);
            }
       } 

        return RealEstateStrategy;
    }());

    Monopoly.GoStrategy = (function () {
        var SALARY = 200;

        function GoStrategy() { }

        GoStrategy.prototype.execute = function (movement, player) {
            player.pay(SALARY);
        }

        return GoStrategy;
    }());

    Monopoly.GoToJailStrategy = (function () {
        function GoToJailStrategy() { }

        GoToJailStrategy.prototype.execute = function (movement, player) {
        }

        return GoToJailStrategy;
    }());

    Monopoly.RailroadStrategy = (function () {
        function RailroadStrategy() {}
        return RailroadStrategy;
    }());

    Monopoly.UtilityStrategy = (function () {
        function UtilityStrategy() {}
        return UtilityStrategy;
    }());

    Monopoly.IncomeTaxStrategy = (function () {
        var INCOME_TAX_RATE = 0.1;
        var MAXIMUM_INCOME_TAX = 200;

        function IncomeTaxStrategy() {}

        IncomeTaxStrategy.prototype.execute = function (movement, player) {
            var tax = player.balance * INCOME_TAX_RATE;
            player.charge(Math.min(tax, MAXIMUM_INCOME_TAX));
        }

        return IncomeTaxStrategy;
    }());

    Monopoly.LuxuryTaxStrategy = (function () {
        var LUXURY_TAX = 75;

        function LuxuryTaxStrategy() {}

        LuxuryTaxStrategy.prototype.execute = function (movement, player, dice) {
            var tax = player.balance > 75 ? LUXURY_TAX : player.balance;
            player.charge(tax);
        }

        return LuxuryTaxStrategy;
    }());

    return Monopoly;
});
