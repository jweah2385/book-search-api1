const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    users: async () => {
      return await User.find().select("-__v -password").populate("savedBooks");
    },
    user: async (parent, { username }) => {
      return await User.findOne({ username })
        .select("-__v -password")
        .populate("savedBooks");
    },
    me: async (parent, args, context) => {
      if (context.user) {
        return await User.findOne({ _id: context.user._id })
          .select("-__v -password")
          .populate("savedBooks");
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, { bookSaved }, context) => {
      if (context.user) {
        const updateUserBooks = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookSaved } },
          { new: true, runValidators: true }
        ).populate('savedBooks');

        return updateUserBooks;
      }
      throw AuthenticationError;
    },
    removeBook: async (parent, { bookId }, context) => {
        if (context.user) {
            const removeSB = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId } } },
                { new: true }
            ).populate('savedBooks');

            return removeSB;
        }
        throw AuthenticationError;
    },
  },
};

module.exports = resolvers;
