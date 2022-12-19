const Sauce = require('../models/sauce');
const fs = require('fs');

//créer sauce
exports.createSauce = (req, res, next) => {
   const sauceObject = JSON.parse(req.body.sauce);
   delete sauceObject._id;
   delete sauceObject._userId;
   const sauce = new Sauce({
       ...sauceObject,
       likes:0,
       dislikes:0,
       usersLiked:[],
       usersDisliked:[],
       userId: req.auth.userId,
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   });
 
   sauce.save()
   .then(() => { res.status(201).json({message: 'Sauce enregistrée !'})})
   .catch(error => {
    console.log('catch du create sauce'+error);
    res.status(400).json( { error })})
};


//Modifier sauce
exports.modifySauce = (req, res, next) => {
   const sauceObject = req.file ? {
       ...JSON.parse(req.body.sauce),
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
 
   delete sauceObject._userId;
   Sauce.findOne({_id: req.params.id})
       .then((sauce) => {
           if (sauce.userId != req.auth.userId) {
               res.status(401).json({ message : 'Non authorise'});
           } else {
               Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
               .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
               .catch(error => res.status(401).json({ error }));
           }
       })
       .catch((error) => {
           res.status(400).json({ error });
       });
};


//Supprimer sauce
exports.deleteSauce = (req, res, next) => {
   Sauce.findOne({ _id: req.params.id})
       .then(sauce => {
           if (sauce.userId != req.auth.userId) {
               res.status(401).json({message: 'Non authorise'});
           } 
           else {
               const filename = sauce.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Sauce.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Sauce supprimé !'})})
                       .catch(error => res.status(401).json(error));
               });
           }
       })
       .catch( error => {
          res.status(500).json(error)}
        )
};

//Récupere une sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({error: error});
    });
};


//Récupere toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({error: error});
    });
};



//Aimer une sauce
exports.likeSauce = (req,res,next) => {
    Sauce.findOne({ _id: req.params.id})
    .then((sauce) => {
      const arrayUsersLiked = sauce.usersLiked.length
      const arrayUsersDisliked = sauce.usersDisliked.length
      Sauce.updateOne ( 
        {_id: req.params.id}, 
        {likes : arrayUsersLiked},
        {dislikes : arrayUsersDisliked}
        )
      .then(() => res.status(200).json({message:"Mis à jour des like"}))
      .catch(error => res.status(400).json(error))
    })
    .catch(error => res.status(400).json(error))

    
      if (req.body.like == 1 ) {
        Sauce.updateOne(
          {_id: req.params.id},
          {$push: {usersLiked : req.auth.userId}})
      }
      else if (req.body.like == -1) {
        Sauce.updateOne(
          {_id: req.params.id},
          {$push: {usersDisliked : req.auth.userId}})
      }
      else if (req.body.like == 0) {
        Sauce.updateOne(
          {_id: req.params.id},
          {$pop: {usersLiked : req.auth.userId}},
          {$pop: {usersDisliked : req.auth.userId}})
      }
     

}

