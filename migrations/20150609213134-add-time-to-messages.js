'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
     return queryInterface.addColumn(
      'Messages',
      'time',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 21,
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Messages', 'time');
  }
};
