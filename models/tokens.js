"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Tokens extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tokens.init(
    {
      refreshToken: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING,
      },
      accessToken: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: false,
      sequelize,
      modelName: "Tokens",
    }
  );
  return Tokens;
};
