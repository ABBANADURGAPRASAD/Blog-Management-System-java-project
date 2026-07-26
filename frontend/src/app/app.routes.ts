import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CreatePostComponent } from './components/create-post/create-post.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { RandomChatComponent } from './components/random-chat/random-chat.component';
import { AvatarGamesComponent } from './components/avatar-games/avatar-games.component';
import { AvatarCityComponent } from './components/avatar-games/avatar-city/avatar-city.component';
import { ChessLobbyComponent } from './components/avatar-games/chess/chess-lobby.component';
import { ChessPlayComponent } from './components/avatar-games/chess/chess-play.component';
import { SketchGameComponent } from './components/avatar-games/sketch/sketch-game.component';
import { KnowledgeGameComponent } from './components/avatar-games/knowledge/knowledge-game.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'create', component: CreatePostComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'profile/edit', component: ProfileEditComponent, canActivate: [authGuard] },
  { path: 'user/:id', component: UserProfileComponent, canActivate: [authGuard] },
  { path: 'random-chat', component: RandomChatComponent, canActivate: [authGuard] },
  { path: 'avatar-games', component: AvatarGamesComponent, canActivate: [authGuard] },
  { path: 'avatar-games/city', component: AvatarCityComponent, canActivate: [authGuard] },
  { path: 'avatar-games/streets', redirectTo: '/avatar-games/city', pathMatch: 'full' },
  { path: 'avatar-games/chess', component: ChessLobbyComponent, canActivate: [authGuard] },
  { path: 'avatar-games/chess/play', component: ChessPlayComponent, canActivate: [authGuard] },
  { path: 'avatar-games/sketch', component: SketchGameComponent, canActivate: [authGuard] },
  {
    path: 'avatar-games/knowledge/:gameId',
    component: KnowledgeGameComponent,
    canActivate: [authGuard],
  },
];
