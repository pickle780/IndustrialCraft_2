var RadiationAPI = {
	items: {},
	playerRad: 0,
	sources: {},
	
	regRadioactiveItem: function(id, duration, stack){
		this.items[id] = [duration, stack || false];
	},
	
	getItemRadiation: function(id){
		return this.items[id] || 0;
	},
	
	isRadioactiveItem: function(id){
		return this.items[id] ? true : false;
	},
	
	emitItemRadiation: function(id){
		var radiation = this.getItemRadiation(id);
		if(radiation){
			if(radiation[1]){
				this.addRadiation(radiation[0]);
			} else {
				this.setRadiation(radiation[0]);
			}
			return true;
		}
		return false;
	},
	
	setRadiation: function(duration){
		this.playerRad = Math.max(this.playerRad, duration);
	},
	
	addRadiation: function(duration){
		this.playerRad = Math.max(this.playerRad + duration, 0);
	},
	
	addEffect: function(ent, duration){
		if(ent == player){
			if(!(Player.getArmorSlot(0).id == ItemID.hazmatHelmet && Player.getArmorSlot(1).id == ItemID.hazmatChestplate &&
			Player.getArmorSlot(2).id == ItemID.hazmatLeggings && Player.getArmorSlot(3).id == ItemID.rubberBoots)){
				Entity.addEffect(player, MobEffect.poison, 1, duration * 20);
				this.setRadiation(duration);
			}
		} else {
			Entity.addEffect(ent, MobEffect.poison, 1, duration * 20);
			if(Entity.getHealth(ent) == 1){
				Entity.damageEntity(ent, 1);
			}
		}
	},
	
	addEffectInRange: function(x, y, z, radius, duration){
		let entities = Entity.getAll();
		for(let i in entities){
			let ent = entities[i];
			if(isMob(ent)){
				let c = Entity.getPosition(ent);
				var xx = Math.abs(x - c.x), yy = Math.abs(y - c.y), zz = Math.abs(z - c.z);
				if(Math.sqrt(xx*xx + yy*yy + zz*zz) <= radius){
					this.addEffect(ent, duration);
				}
			}
		}
	},
	
	addRadiationSource: function(x, y, z, radius, duration){
		this.sources[x+':'+y+':'+z] = {
			x: x,
			y: y,
			z: z,
			radius: radius,
			timer: duration
		}
	},
	
	tick: function(){
		if(World.getThreadTime()%20 == 0){
			var radiation = false;
			var armor = [Player.getArmorSlot(0), Player.getArmorSlot(1), Player.getArmorSlot(2), Player.getArmorSlot(3)];
			if(!(armor[0].id == ItemID.hazmatHelmet && armor[1].id == ItemID.hazmatChestplate && armor[2].id == ItemID.hazmatLeggings && armor[3].id == ItemID.rubberBoots)){
				for(var i = 9; i < 45; i++){
					var slot = Player.getInventorySlot(i);
					if(this.emitItemRadiation(slot.id)){
						radiation = true;
					}
				}
			}
			if(!radiation){
				this.addRadiation(-1);
			}
			if(this.playerRad > 0 && !(armor[0].id == ItemID.quantumHelmet && armor[0].data + 1e5 <= Item.getMaxDamage(armor[0].id))){
				Entity.addEffect(player, MobEffect.poison, 1, this.playerRad * 20);
				if(Entity.getHealth(player) == 1){
					Entity.damageEntity(player, 1);
				}
			}
			for(var i in this.sources){
				var source = this.sources[i];
				this.addEffectInRange(source.x, source.y, source.z, source.radius, 10);
				source.timer--;
				if(source.timer <= 0){
					delete this.sources[i];
				}
			}
		}
	}
}

Saver.addSavesScope("radiation",
    function read(scope){
        RadiationAPI.playerRad = scope.duration || 0;
		RadiationAPI.sources = scope.sources || {};
    },
    function save(){
        return {
            duration: RadiationAPI.playerRad,
			sources: RadiationAPI.sources
        }
    }
);

Callback.addCallback("tick", function(){
	RadiationAPI.tick();
});

Callback.addCallback("EntityDeath", function(entity){
	if(entity == player){
		RadiationAPI.playerRad = 0;
	}
});
