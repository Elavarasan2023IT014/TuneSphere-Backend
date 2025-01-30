const express  = require('express')
const app = express()
app.use(express.json())
const mongoose = require('mongoose');
const bcrypt=require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require('cors');
app.use(cors());
const url = "mongodb://localhost:27017/Mern";
port = 8001;
mongoose
    .connect(url)
    .then(()=>{
        console.log("DB connected")
        app.listen(port,()=>{
            console.log(`MY server is Running http://localhost:${port}`);
        })
    })


const userSchema = new mongoose.Schema({
    username:{type:String,required:true, unique:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true}
});
const Credential=mongoose.model("Credential",userSchema);


app.post("/api/signup",async (req,res)=>{
    const {username,email,password}=req.body;

    if(!username || !password || !email){
        return res.status(400).json({message:"All feilds  are required"});
    }

    const existingUsername = await Credential.findOne({ username });
if (existingUsername) {
    return res.status(400).json({ message: "Username already exists" });
}
const existingEmail = await Credential.findOne({ email });
if (existingEmail) {
    return res.status(400).json({ message: "Email already exists" });
}


    const hashedPassword =await bcrypt.hash(password,10);

    const newUser = new Credential({
        username,
        email,
        password:hashedPassword
    });

    await newUser.save();
    return res.status(201).json({message:"User registered successfully"});

});

app.post("/api/login",async (req,res)=>{
    const {email,password}=req.body;

    if(!email|| !password){
        return res.status(400).json({message:"Email and password are required"});
    }

    const user = await Credential.findOne({email});
    if(!user){
        return res.status(400).json({message:"No user"});
    }

    const isValid =await bcrypt.compare(password,user.password);

    if(!isValid){
        return res.status(401).json({message:"Invalid cridentials"});

    }
    const token = jwt.sign({email},"prince",{expiresIn:"1h"});

    return res.status(201).json({username:user.username,email:user.email});

});

app.get("/api/login_details/:email",async (req,res)=>{
    const {email}=req.params;

    const user = await Credential.findOne({email});
    if(!user){
        return res.status(400).json({message:"No user"});
    }
    return res.status(201).json({"password":user.password});

});

//MiddleWare
function authenticateToken(req,res,next){
    const token = req.header("Authorization")?.split(" ")[1];
    if(!token) return res.sendStatus(401).json({message:"Null Token"});

    jwt.verify(token,"prince",(err,user)=>{
        if(err) return res.status(403).json({message:"Invalid Token"});
        req.user = user;
    next();
});
}
app.put('/update-password', async (req, res) => {
  const { username, newPassword } = req.body;
  

  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Username and new password are required' });
  }

  try {
    const user = await Credential.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
 
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



//user playlist Schema:
const userPlaylistSchema = new mongoose.Schema({
    username: {
      type: String,
      ref: 'Credential', // Reference to the Credential collection
      required: true,
    },
    playlists: [
      {
        name: {
          type: String,
          required: true,
        },
        songs: [
          {
            title: {
              type: String,
              required: true,
            },
            url: {
              type: String,
              required: true,
            }
          }
        ]
      }
    ]
  }, { timestamps: true });

  const UserPlaylist = mongoose.model('UserPlaylist', userPlaylistSchema);

  // app.post('/playlist:', async (req, res) => {
  //   try {
  //     const { username, playlists } = req.body;
  
  //     // Validate input
  //     if (!username || typeof username !== 'string') {
  //       return res.status(400).json({ message: 'Invalid input. "user" must be a non-empty string.' });
  //   }
  //   if (!playlists || !Array.isArray(playlists)) {
  //       return res.status(400).json({ message: 'Invalid input. "playlists" must be a non-empty array.' });
  //   }
  
  //     // Check if the user exists in the Credential collection
  //     const existingUser = await Credential.findOne({ username: username });
  //     if (!existingUser) {
  //       return res.status(404).json({ message: 'User not found in Credential collection.' });
  //     }
  
  //     // Find or create the user's playlist document in UserPlaylist
  //     let userPlaylist = await UserPlaylist.findOne({ username: existingUser.username});
  
  //     if (!userPlaylist) {
  //       // If no playlist document exists, create one
  //       userPlaylist = new UserPlaylist({
  //         username: existingUser.username,
  //         playlists: [],
  //       });
  //     }
  
  //     // Add playlists to the user's existing playlists
  //     playlists.forEach((playlist) => {
  //       userPlaylist.playlists.push(playlist);
  //     });
  
  //     // Save the updated or new UserPlaylist document
  //     await userPlaylist.save();
  
  //     res.status(201).json({
  //       message: 'Playlists added successfully.',
  //       userPlaylist,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: 'Internal server error.' });
  //   }
  // });

  app.post('/playlist', async (req, res) => {
    try {
      const { username, playlistName } = req.body;
  
  
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Invalid input. "username" must be a non-empty string.' });
      }
      if (!playlistName || typeof playlistName !== 'string') {
        return res.status(400).json({ message: 'Invalid input. "playlistName" must be a non-empty string.' });
      }

      const user = await Credential.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found in the credential collection.' });
      }
  

      const userPlaylist = await UserPlaylist.findOne({ username });
      if (!userPlaylist) {
        const newPlaylist = new UserPlaylist({
          username,
          playlists: [{ name: playlistName, songs: [] }],
        });
        await newPlaylist.save();
      } else {
        const existingPlaylist = userPlaylist.playlists.find(p => p.name === playlistName);
        if (existingPlaylist) {
          return res.status(400).json({ message: 'Playlist with the same name already exists.' });
        }
        userPlaylist.playlists.push({ name: playlistName, songs: [] });
        await userPlaylist.save();
      }
  
      res.status(201).json({ message: 'Playlist added successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  

  // Get user's playlists
app.get('/playlist/:username', async (req, res) => {
  try {
    const userPlaylist = await UserPlaylist.findOne({ username: req.params.username });
    res.json(userPlaylist || { playlists: [] });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add song to playlist
app.post('/playlist/:username/:playlistName/songs', async (req, res) => {
  try {
    const { username, playlistName } = req.params;
    const { title, url } = req.body;


    const userPlaylist = await UserPlaylist.findOne({ username });
    if (!userPlaylist) {
      return res.status(404).json({ message: 'User not found' });
    }


    const playlist = userPlaylist.playlists.find(p => p.name === playlistName);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }


    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }


    playlist.songs.push({ title, url });
    await userPlaylist.save();
    res.json({ message: 'Song added successfully' });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Update song
// app.put('/playlist/:username/:playlistName/songs/:songId', async (req, res) => {
//   try {
//     const { username, playlistName, songId } = req.params;
//     const { title, url } = req.body;

//     const userPlaylist = await UserPlaylist.findOne({ username });
//     if (!userPlaylist) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const playlist = userPlaylist.playlists.find(p => p.name === playlistName);
//     if (!playlist) {
//       return res.status(404).json({ message: 'Playlist not found' });
//     }


//     const song = playlist.songs.find(s => s._id.toString() === songId);
//     if (!song) {
//       return res.status(404).json({ message: 'Song not found' });
//     }


//     if (title) song.title = title;
//     if (url) song.url = url;


//     await userPlaylist.save();

//     res.json({ message: 'Song updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


// Delete song
app.delete('/playlist/:username/:playlistName/songs/:title', async (req, res) => {
  try {
    const { username, playlistName, title } = req.params;

   
    const userPlaylist = await UserPlaylist.findOne({ username });
    if (!userPlaylist) {
      return res.status(404).json({ message: 'User not found' });
    }

    const playlist = userPlaylist.playlists.find(p => p.name === playlistName);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }


    const songIndex = playlist.songs.findIndex(s => s.title === title);
    if (songIndex === -1) {
      return res.status(404).json({ message: 'Song not found' });
    }

    playlist.songs.splice(songIndex, 1);

    await userPlaylist.save();

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


  





