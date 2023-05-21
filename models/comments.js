"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Posts, {
        targetKey: "postId",
        foreignKey: "postId",
        onDelete: "CASCADE",
      });
      this.belongsTo(models.Users, {
        targetKey: "userId",
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  Comments.init(
    {
      commentId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      comment: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      commentCreatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      sequelize,
      modelName: "Comments",
    }
  );
  return Comments;
};
