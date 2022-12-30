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


// Liker une sauce
exports.likeSauce = async (req, res, next) => {
    let sauce = await Sauce.findOne({ _id: req.params.id });
    if (!sauce) 
    { 
        res.status(404).json({ message : "pas de sauce" })
        return
    }
    switch (req.body.like)
    {        
      case 1:
      if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId))
      {
        sauce.likes += 1
        sauce.usersLiked.push(req.body.userId)
        await sauce.save()
            .then(() => res.status(201).json({ message: "like" }))
            .catch(error => res.status(400).json({ error:error }));     
    }
      else
      {
          res.status(418).json({ message: 'vous avez déja liker avec une théiére' });
      }
  break;

        case -1:
            if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId))
            {
                sauce.dislikes += 1
                sauce.usersDisliked.push(req.body.userId)
                await sauce.save()
                    .then(() => res.status(201).json({ message: "dislike" }))
                    .catch(error => res.status(400).json({ error:error }));     
            }
            else
            {
                res.status(400).json({ message: 'vous avez déja dislike' });
            }
        break;

        case 0:
            if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId))
            { 
                res.status(400).json({ message: "vous n'avez jamais voté" })
                return
            }
            
          
            if (sauce.usersLiked.includes(req.body.userId))
            {
              sauce.likes -= 1
              sauce.usersLiked.pull(req.body.userId)
              await sauce.save()
                  .then(() => res.status(201).json({ message: "like" }))
                  .catch(error => res.status(400).json({ error:error }));     
          }
            
          
            if (sauce.usersDisliked.includes(req.body.userId))
            {
              sauce.dislikes -= 1
              sauce.usersDisliked.pull(req.body.userId)
              await sauce.save()
                  .then(() => res.status(201).json({ message: "dislike" }))
                  .catch(error => res.status(400).json({ error:error }));     
          }
        break;
    }
};
