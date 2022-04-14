import React from 'react';
import { Avatar, SimpleGrid, VStack, Text } from '@chakra-ui/react';
import teamdata from '../config/team.json';

/**
 * Individual Profile card with avatar, name and domain vertically stacked
 */
const ProfileCard = (props: any) => {
  return (
    <VStack>
      <Avatar size="2xl" name={props.profile.name} src={props.profile.avatar} />
      <Text fontSize="lg">{props.profile.name}</Text>
      <Text fontSize="md">{props.profile.domain.join(', ')}</Text>
    </VStack>
  );
};

/**
 * Component to render Player Team cards
 */
export const PlayerTeam = () => {
  return (
    <SimpleGrid columns={[2, null, 3]} spacing="40px">
      {teamdata.map((element) => {
        return <ProfileCard key={element.name} profile={element} />;
      })}
    </SimpleGrid>
  );
};
